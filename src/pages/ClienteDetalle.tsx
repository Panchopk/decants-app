import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EtiquetaSaldo } from '../components/Monto'
import { db } from '../db/db'
import type { MetodoPago } from '../db/tipos'
import { saldoCliente } from '../lib/calculos'
import { formatoFecha, formatoMl, formatoMonto } from '../lib/formato'
import { enlaceWhatsApp } from '../lib/whatsapp'

type Movimiento =
  | { tipo: 'venta'; fecha: string; id: string }
  | { tipo: 'pago'; fecha: string; id: string }

export default function ClienteDetalle() {
  const { id = '' } = useParams()
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
  const movimientos: Movimiento[] = [
    ...ventas.map((v) => ({ tipo: 'venta' as const, fecha: v.fecha, id: v.id })),
    ...pagos.map((p) => ({ tipo: 'pago' as const, fecha: p.fecha, id: p.id })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const nombrePerfume = (pid: string) => perfumes.find((p) => p.id === pid)?.nombre ?? 'Perfume'

  async function guardarPago(e: React.FormEvent) {
    e.preventDefault()
    const m = Math.round(Number(monto))
    if (!monto.trim() || Number.isNaN(m) || m <= 0) return setError('Escribe un monto mayor a 0.')
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
  }

  async function eliminarPago(pagoId: string, m: number) {
    if (confirm(`¿Eliminar el pago de ${formatoMonto(m)}? Esto aumentará lo que debe el cliente.`)) {
      await db.pagos.delete(pagoId)
    }
  }

  async function anularVenta(ventaId: string) {
    if (
      confirm(
        'Anular esta venta devuelve los ml al perfume y baja la deuda. Los pagos ya registrados se conservan. ¿Anular?',
      )
    ) {
      await db.ventas.update(ventaId, { anulada: true })
    }
  }

  return (
    <section>
      <Link to="/clientes" className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm text-accent-text">
        ← Clientes
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{cliente.nombre}</h1>
      {cliente.telefono && <p className="text-muted">{cliente.telefono}</p>}
      {cliente.nota && <p className="mt-1 text-sm text-muted">{cliente.nota}</p>}

      <div className="mt-4 rounded-xl bg-surface p-4 text-2xl shadow-sm" data-testid="saldo">
        <EtiquetaSaldo saldo={saldo} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setPagando((p) => !p)}
          className="rounded-lg bg-primary p-3 font-medium text-on-primary"
        >
          Registrar pago
        </button>
        <Link
          to={`/clientes/${cliente.id}/editar`}
          className="rounded-lg bg-sunken p-3 text-center font-medium"
        >
          Editar
        </Link>
      </div>

      {saldo > 0 &&
        (() => {
          const enlace = enlaceWhatsApp(cliente.telefono, cliente.nombre, saldo)
          return enlace ? (
            <a
              href={enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-lg bg-credit-btn p-3 text-center font-medium text-white"
            >
              Recordar por WhatsApp
            </a>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Agrega un teléfono (con código de país) para recordar por WhatsApp.
            </p>
          )
        })()}

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
          <button type="submit" className="w-full rounded-lg bg-primary p-3 font-medium text-on-primary">
            Guardar pago
          </button>
        </form>
      )}

      <h2 className="mt-6 font-semibold">Historial</h2>
      {movimientos.length === 0 ? (
        <p className="text-sm text-muted">Sin movimientos todavía.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {movimientos.map((m) => {
            if (m.tipo === 'venta') {
              const v = ventas.find((x) => x.id === m.id)!
              return (
                <li
                  key={m.id}
                  className={`rounded-lg bg-surface p-3 text-sm shadow-sm ${v.anulada ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Venta{v.anulada && ' (anulada)'}</span>
                    <span className="text-debt">+{formatoMonto(v.total)}</span>
                  </div>
                  <div className="text-muted">{formatoFecha(v.fecha)}</div>
                  {v.items.map((i, k) => (
                    <div key={k} className="text-strong">
                      {i.cantidad} × {formatoMl(i.ml)} ml {nombrePerfume(i.perfumeId)}
                    </div>
                  ))}
                  {!v.anulada && (
                    <div className="text-right">
                      <button onClick={() => anularVenta(v.id)} className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-debt">
                        Anular
                      </button>
                    </div>
                  )}
                </li>
              )
            }
            const p = pagos.find((x) => x.id === m.id)!
            return (
              <li key={m.id} className="rounded-lg bg-surface p-3 text-sm shadow-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Pago{p.metodo && ` · ${p.metodo}`}</span>
                  <span className="text-credit">−{formatoMonto(p.monto)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>
                    {formatoFecha(p.fecha)}
                    {p.nota && ` · ${p.nota}`}
                  </span>
                  <button
                    onClick={() => eliminarPago(p.id, p.monto)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-debt"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
