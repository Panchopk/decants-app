import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useAvisos } from '../components/Avisos'
import { IconoOpciones } from '../components/Iconos'
import { useConfirmar } from '../components/PanelConfirmar'
import { db } from '../db/db'
import type { MetodoPago } from '../db/tipos'
import { saldoCliente } from '../lib/calculos'
import { claveDia, etiquetaDia, formatoMl, formatoMonto } from '../lib/formato'
import { enlaceWhatsApp } from '../lib/whatsapp'

type Movimiento = { tipo: 'venta' | 'pago'; fecha: string; id: string }

const principal = 'flex min-h-12 w-full items-center justify-center rounded-lg px-4 font-semibold'
const secundario = 'flex min-h-11 items-center justify-center rounded-lg bg-sunken px-3 font-medium'

export default function ClienteDetalle() {
  const { id = '' } = useParams()
  const { confirmar, panel } = useConfirmar()
  const avisar = useAvisos()
  const [pagando, setPagando] = useState(false)
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago | ''>('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')

  const datos = useLiveQuery(async () => {
    const cliente = await db.clientes.get(id)
    const [ventas, pagos, perfumes] = await Promise.all([
      db.ventas.where('clienteId').equals(id).toArray(),
      db.pagos.where('clienteId').equals(id).toArray(),
      db.perfumes.toArray(),
    ])
    return { cliente, ventas, pagos, perfumes }
  }, [id])

  if (!datos) return null
  const { cliente, ventas, pagos, perfumes } = datos
  if (!cliente) {
    return (
      <section>
        <p>Cliente no encontrado.</p>
        <Link to="/clientes" className="inline-flex min-h-11 items-center text-accent-text">
          Volver
        </Link>
      </section>
    )
  }

  const saldo = saldoCliente(cliente.id, ventas, pagos)
  const estado = saldo > 0 ? 'Debe' : saldo < 0 ? 'A favor' : 'Al día'
  const enlace = saldo > 0 ? enlaceWhatsApp(cliente.telefono, cliente.nombre, saldo) : null
  const movimientos: Movimiento[] = [
    ...ventas.map((v) => ({ tipo: 'venta' as const, fecha: v.fecha, id: v.id })),
    ...pagos.map((p) => ({ tipo: 'pago' as const, fecha: p.fecha, id: p.id })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))

  // Agrupar por día conservando el orden (más reciente primero)
  const dias: { clave: string; fecha: string; movs: Movimiento[] }[] = []
  for (const m of movimientos) {
    const clave = claveDia(m.fecha)
    const ultimo = dias.at(-1)
    if (ultimo && ultimo.clave === clave) ultimo.movs.push(m)
    else dias.push({ clave, fecha: m.fecha, movs: [m] })
  }
  const nombrePerfume = (pid: string) => perfumes.find((p) => p.id === pid)?.nombre ?? 'Perfume'

  async function guardarPago(e: React.FormEvent) {
    e.preventDefault()
    const m = Math.round(Number(monto))
    if (!monto.trim() || Number.isNaN(m) || m <= 0) return setError('Escribir un monto mayor a 0.')
    await db.pagos.add({
      id: crypto.randomUUID(),
      clienteId: cliente!.id,
      monto: m,
      fecha: new Date().toISOString(),
      metodo: metodo || undefined,
      nota: nota.trim() || undefined,
    })
    setMonto('')
    setMetodo('')
    setNota('')
    setError('')
    setPagando(false)
    avisar('Pago registrado')
  }

  async function eliminarPago(pagoId: string, m: number) {
    const si = await confirmar({
      titulo: '¿Eliminar este pago?',
      descripcion: `Lo que debe el cliente sube ${formatoMonto(m)}. No se puede deshacer.`,
      confirmar: 'Eliminar pago',
      peligro: true,
    })
    if (si) {
      await db.pagos.delete(pagoId)
      avisar('Pago eliminado')
    }
  }

  async function anularVenta(ventaId: string, total: number) {
    const si = await confirmar({
      titulo: '¿Anular esta venta?',
      descripcion: `Los ml vuelven al perfume y la deuda baja ${formatoMonto(total)}. Los pagos ya registrados se conservan.`,
      confirmar: 'Anular venta',
      peligro: true,
    })
    if (si) {
      await db.ventas.update(ventaId, { anulada: true })
      avisar('Venta anulada')
    }
  }

  const botonOpciones = (etiqueta: string, accion: () => void) => (
    <button
      aria-label={etiqueta}
      onClick={accion}
      className="-mr-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted"
    >
      <IconoOpciones />
    </button>
  )

  return (
    <section>
      <Link to="/clientes" className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm text-accent-text">
        ← Clientes
      </Link>
      <div className="mt-1 flex items-center gap-3">
        <Avatar nombre={cliente.nombre} grande />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{cliente.nombre}</h1>
          {cliente.telefono && <p className="text-muted">{cliente.telefono}</p>}
        </div>
      </div>
      {cliente.nota && <p className="mt-2 text-sm text-muted">{cliente.nota}</p>}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface p-4 shadow-sm" data-testid="saldo">
        <div>
          <div className="text-sm text-muted">Saldo</div>
          <div
            className={`text-3xl font-bold ${saldo > 0 ? 'text-debt' : saldo < 0 ? 'text-credit' : 'text-ink'}`}
          >
            {formatoMonto(Math.abs(saldo))}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            saldo > 0
              ? 'bg-debt-soft text-debt-ink'
              : saldo < 0
                ? 'bg-credit-soft text-credit-ink'
                : 'bg-sunken text-muted'
          }`}
        >
          {estado}
        </span>
      </div>

      {/* Una sola acción principal según el caso; el resto son secundarias */}
      <div className="mt-3 space-y-2">
        {enlace ? (
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className={`${principal} bg-credit-btn text-white`}
          >
            Recordar por WhatsApp
          </a>
        ) : saldo > 0 ? (
          <button onClick={() => setPagando((p) => !p)} className={`${principal} bg-primary text-on-primary`}>
            Registrar pago
          </button>
        ) : (
          <Link to={`/venta?cliente=${cliente.id}`} className={`${principal} bg-primary text-on-primary`}>
            Nueva venta
          </Link>
        )}
        <div className="grid grid-cols-2 gap-2">
          {(enlace || saldo <= 0) && (
            <button onClick={() => setPagando((p) => !p)} className={secundario}>
              Registrar pago
            </button>
          )}
          {saldo > 0 && (
            <Link to={`/venta?cliente=${cliente.id}`} className={secundario}>
              Nueva venta
            </Link>
          )}
          <Link to={`/clientes/${cliente.id}/editar`} className={secundario}>
            Editar
          </Link>
        </div>
        {saldo > 0 && !enlace && (
          <p className="text-sm text-muted">
            Sin teléfono para recordar por WhatsApp.{' '}
            <Link to={`/clientes/${cliente.id}/editar`} className="font-medium text-accent-text">
              Agregar teléfono
            </Link>
          </p>
        )}
      </div>

      {pagando && (
        <form onSubmit={guardarPago} className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-sm">
          <label className="block text-sm font-medium">
            Monto
            <input
              className="mt-1 w-full rounded-lg border border-line-strong p-3"
              type="number"
              inputMode="numeric"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </label>
          {saldo > 0 && (
            <button
              type="button"
              onClick={() => setMonto(String(saldo))}
              className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text"
            >
              Pagar todo ({formatoMonto(saldo)})
            </button>
          )}
          <label className="block text-sm font-medium">
            Método (opcional)
            <select
              className="mt-1 w-full rounded-lg border border-line-strong bg-surface p-3"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago | '')}
            >
              <option value="">—</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Nota (opcional)
            <input
              className="mt-1 w-full rounded-lg border border-line-strong p-3"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-debt">{error}</p>}
          <button type="submit" className="min-h-12 w-full rounded-lg bg-primary font-semibold text-on-primary">
            Guardar pago
          </button>
        </form>
      )}

      <h2 className="mt-6 font-semibold">Historial</h2>
      {movimientos.length === 0 ? (
        <p className="mt-1 text-sm text-muted">Sin movimientos todavía.</p>
      ) : (
        <div className="mt-1 space-y-4">
          {dias.map((d) => (
            <div key={d.clave}>
              <h3 className="text-sm font-medium text-muted">{etiquetaDia(d.fecha)}</h3>
              <ul className="mt-1 space-y-2">
                {d.movs.map((m) => {
                  if (m.tipo === 'venta') {
                    const v = ventas.find((x) => x.id === m.id)!
                    return (
                      <li
                        key={m.id}
                        className={`flex items-start gap-2 rounded-lg bg-surface p-3 pr-1 text-sm shadow-sm ${v.anulada ? 'opacity-60' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">
                            Venta
                            {v.anulada && (
                              <span className="ml-2 rounded bg-sunken px-1.5 py-0.5 text-xs font-medium text-muted">
                                Anulada
                              </span>
                            )}
                          </div>
                          {v.items.map((i, k) => (
                            <div key={k} className="text-strong">
                              {i.cantidad} × {formatoMl(i.ml)} ml {nombrePerfume(i.perfumeId)}
                            </div>
                          ))}
                          {v.nota && <div className="text-muted">{v.nota}</div>}
                        </div>
                        <div className={`pt-0.5 font-semibold ${v.anulada ? 'line-through' : 'text-debt'}`}>
                          +{formatoMonto(v.total)}
                        </div>
                        {v.anulada ? (
                          <span className="w-9 shrink-0" />
                        ) : (
                          botonOpciones('Opciones de la venta', () => anularVenta(v.id, v.total))
                        )}
                      </li>
                    )
                  }
                  const p = pagos.find((x) => x.id === m.id)!
                  return (
                    <li key={m.id} className="flex items-start gap-2 rounded-lg bg-surface p-3 pr-1 text-sm shadow-sm">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Pago{p.metodo && ` · ${p.metodo}`}</div>
                        {p.nota && <div className="text-muted">{p.nota}</div>}
                      </div>
                      <div className="pt-0.5 font-semibold text-credit">−{formatoMonto(p.monto)}</div>
                      {botonOpciones('Opciones del pago', () => eliminarPago(p.id, p.monto))}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      {panel}
    </section>
  )
}
