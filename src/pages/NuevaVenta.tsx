import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import type { Cliente, ItemVenta, Pago, Venta } from '../db/tipos'
import { mlRestantes, saldoCliente, totalVenta } from '../lib/calculos'
import { formatoMl, formatoMonto } from '../lib/formato'

type ItemLocal = ItemVenta & { uid: string }
type ModoPago = 'todo' | 'mitad' | 'otro'

const campo = 'w-full rounded-lg border border-line-strong bg-surface p-3 text-base'
const chip = 'inline-flex min-h-11 items-center rounded-lg px-4 font-medium'

export default function NuevaVenta() {
  const navigate = useNavigate()
  const datos = useLiveQuery(async () => {
    const [clientes, perfumes, ventas, ajustes, pagos] = await Promise.all([
      db.clientes.toArray(),
      db.perfumes.toArray(),
      db.ventas.toArray(),
      db.ajustes.toArray(),
      db.pagos.toArray(),
    ])
    return { clientes, perfumes, ventas, ajustes, pagos }
  })

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState<ItemLocal[]>([])
  const [abiertos, setAbiertos] = useState<string[]>([])
  const [filtro, setFiltro] = useState('')
  const [pagoAhora, setPagoAhora] = useState(false)
  const [modoPago, setModoPago] = useState<ModoPago>('todo')
  const [montoOtro, setMontoOtro] = useState('')
  const [nota, setNota] = useState('')
  const [notaAbierta, setNotaAbierta] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!datos) return null
  const { clientes, perfumes, ventas, ajustes, pagos } = datos
  const activos = perfumes
    .filter((p) => !p.archivado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const nombrePerfume = (id: string) => perfumes.find((p) => p.id === id)?.nombre ?? 'Perfume'
  const total = totalVenta(items)

  // Clientes: los de la última venta primero; si no hay ventas, los más recientes
  const ultimaVenta = new Map<string, string>()
  for (const v of ventas) {
    if (!ultimaVenta.has(v.clienteId) || v.fecha > ultimaVenta.get(v.clienteId)!) {
      ultimaVenta.set(v.clienteId, v.fecha)
    }
  }
  const recientes = [...clientes]
    .sort((a, b) =>
      (ultimaVenta.get(b.id) ?? b.creadoEn).localeCompare(ultimaVenta.get(a.id) ?? a.creadoEn),
    )
    .slice(0, 6)

  const q = busqueda.trim().toLowerCase()
  const coincidencias = q
    ? clientes.filter((c) => c.nombre.toLowerCase().includes(q)).slice(0, 6)
    : recientes
  const hayExacto = clientes.some((c) => c.nombre.toLowerCase() === q)

  async function crearCliente() {
    const nuevo: Cliente = {
      id: crypto.randomUUID(),
      nombre: busqueda.trim(),
      creadoEn: new Date().toISOString(),
    }
    await db.clientes.add(nuevo)
    setCliente(nuevo)
    setBusqueda('')
  }

  function sumar(perfumeId: string, ml: number, precio: number, abrir = false) {
    const uid = crypto.randomUUID()
    setItems((its) => {
      // Si ya existe el mismo perfume + tamaño + precio, suma cantidad
      const i = its.findIndex(
        (x) => x.perfumeId === perfumeId && x.ml === ml && x.precioUnitario === precio,
      )
      if (i >= 0 && !abrir) return its.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x))
      return [...its, { uid, perfumeId, ml, cantidad: 1, precioUnitario: precio }]
    })
    if (abrir) setAbiertos((a) => [...a, uid])
    setError('')
  }

  function cambiar(uid: string, cambio: Partial<ItemVenta>) {
    setItems((its) => its.map((x) => (x.uid === uid ? { ...x, ...cambio } : x)))
  }

  const quitar = (uid: string) => setItems((its) => its.filter((x) => x.uid !== uid))
  const alternarEdicion = (uid: string) =>
    setAbiertos((a) => (a.includes(uid) ? a.filter((x) => x !== uid) : [...a, uid]))

  // Cuántos decants de este perfume y tamaño hay ya en la venta
  const cantidadEn = (perfumeId: string, ml: number) =>
    items.filter((i) => i.perfumeId === perfumeId && i.ml === ml).reduce((s, i) => s + i.cantidad, 0)

  // Advertencias de stock: ml que quedarían tras esta venta
  const advertencias = [...new Set(items.map((i) => i.perfumeId))]
    .map((pid) => {
      const p = perfumes.find((x) => x.id === pid)
      if (!p) return null
      const actual = mlRestantes(pid, p.mlIniciales, ventas, ajustes)
      const usado = items.filter((i) => i.perfumeId === pid).reduce((s, i) => s + i.ml * i.cantidad, 0)
      return actual - usado < 0
        ? `${p.nombre}: quedan ${formatoMl(actual)} ml y se están vendiendo ${formatoMl(usado)} ml.`
        : null
    })
    .filter(Boolean) as string[]

  const saldoPrevio = cliente ? saldoCliente(cliente.id, ventas, pagos) : 0

  const pagado = !pagoAhora
    ? 0
    : modoPago === 'todo'
      ? total
      : modoPago === 'mitad'
        ? Math.round(total / 2)
        : Math.round(Number(montoOtro) || 0)

  async function guardar() {
    if (!cliente) return setError('Elegir un cliente.')
    if (items.length === 0) return setError('Agregar al menos un perfume.')
    if (items.some((i) => !(i.ml > 0) || !(i.cantidad >= 1) || !(i.precioUnitario >= 0)))
      return setError('Revisar los ml, las cantidades y los precios.')
    if (pagoAhora && modoPago === 'otro' && (montoOtro.trim() === '' || !(pagado >= 0)))
      return setError('Escribir el monto pagado.')

    setGuardando(true)
    const ahora = new Date().toISOString()
    const venta: Venta = {
      id: crypto.randomUUID(),
      clienteId: cliente.id,
      fecha: ahora,
      nota: nota.trim() || undefined,
      items: items.map(({ uid, ...i }) => {
        void uid
        return { ...i, precioUnitario: Math.round(i.precioUnitario) }
      }),
      total: 0,
      anulada: false,
    }
    venta.total = totalVenta(venta.items)
    await db.transaction('rw', db.ventas, db.pagos, async () => {
      await db.ventas.add(venta)
      if (pagado > 0) {
        const pago: Pago = {
          id: crypto.randomUUID(),
          clienteId: cliente.id,
          monto: pagado,
          // 1 ms después para que en el historial el pago quede sobre la venta
          fecha: new Date(Date.parse(ahora) + 1).toISOString(),
        }
        await db.pagos.add(pago)
      }
    })
    navigate(`/clientes/${cliente.id}`)
  }

  const f = filtro.trim().toLowerCase()
  const visibles = activos.filter((p) => !f || `${p.nombre} ${p.marca ?? ''}`.toLowerCase().includes(f))

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nueva venta</h1>
        <Link to="/" className="inline-flex min-h-11 items-center px-2 text-sm text-accent-text">
          Cancelar
        </Link>
      </div>

      {/* Cliente */}
      <h2 className="mt-3 text-sm font-medium">Cliente</h2>
      {cliente ? (
        <div className="mt-1 flex items-center justify-between rounded-lg bg-surface p-3 shadow-sm">
          <div>
            <div className="font-semibold">{cliente.nombre}</div>
            {saldoPrevio !== 0 && (
              <div className="text-xs text-muted">
                {saldoPrevio > 0
                  ? `Debe ${formatoMonto(saldoPrevio)} antes de esta venta`
                  : `Saldo a favor ${formatoMonto(-saldoPrevio)}`}
              </div>
            )}
          </div>
          <button
            onClick={() => setCliente(null)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm text-accent-text"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div className="mt-1">
          <input
            className={campo}
            placeholder="Buscar o escribir el nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <ul className="mt-2 flex flex-wrap gap-2">
            {coincidencias.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setCliente(c)
                    setBusqueda('')
                    setError('')
                  }}
                  className={`${chip} bg-surface shadow-sm`}
                >
                  {c.nombre}
                </button>
              </li>
            ))}
            {q && !hayExacto && (
              <li>
                <button
                  onClick={crearCliente}
                  className={`${chip} border border-dashed border-primary-edge text-accent-text`}
                >
                  + Crear cliente "{busqueda.trim()}"
                </button>
              </li>
            )}
          </ul>
          {!q && clientes.length === 0 && (
            <p className="mt-2 text-sm text-muted">Sin clientes todavía: escribir un nombre para crear el primero.</p>
          )}
        </div>
      )}

      {/* Perfumes y tamaños */}
      <h2 className="mt-5 text-sm font-medium">Perfumes</h2>
      {activos.length === 0 ? (
        <p className="mt-1 text-sm text-muted">
          No hay perfumes.{' '}
          <Link to="/perfumes/nuevo" className="font-medium text-accent-text">
            Crear uno
          </Link>
        </p>
      ) : (
        <>
          {activos.length > 5 && (
            <input
              type="search"
              className={`${campo} mt-1`}
              placeholder="Buscar perfume"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          )}
          <ul className="mt-2 space-y-3">
            {visibles.map((p) => {
              const rest = mlRestantes(p.id, p.mlIniciales, ventas, ajustes)
              return (
                <li key={p.id} className="rounded-xl bg-surface p-3 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{p.nombre}</span>
                    <span className={`text-xs ${rest <= 0 ? 'font-semibold text-debt' : 'text-muted'}`}>
                      {formatoMl(rest)} ml
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.precios.map((pr) => {
                      const n = cantidadEn(p.id, pr.ml)
                      return (
                        <button
                          key={pr.ml}
                          onClick={() => sumar(p.id, pr.ml, pr.precio)}
                          aria-label={`Agregar ${formatoMl(pr.ml)} ml de ${p.nombre}`}
                          className={`${chip} gap-2 ${n > 0 ? 'bg-primary text-on-primary' : 'bg-primary-soft text-primary-soft-ink'}`}
                        >
                          <span>
                            {formatoMl(pr.ml)} ml · {formatoMonto(pr.precio)}
                          </span>
                          {n > 0 && <span className="rounded-full bg-on-primary/25 px-2 text-sm">×{n}</span>}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => sumar(p.id, 1, 0, true)}
                      className={`${chip} bg-sunken`}
                    >
                      Otro tamaño
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Resumen de la venta */}
      {items.length > 0 && (
        <>
          <h2 className="mt-5 text-sm font-medium">En esta venta</h2>
          <ul className="mt-2 space-y-2">
            {items.map((it) => {
              const abierto = abiertos.includes(it.uid)
              return (
                <li key={it.uid} className="rounded-xl bg-surface p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{nombrePerfume(it.perfumeId)}</div>
                      <div className="text-sm text-muted">
                        {formatoMl(it.ml)} ml · {formatoMonto(it.precioUnitario)} c/u
                      </div>
                    </div>
                    <div className="font-semibold">{formatoMonto(it.precioUnitario * it.cantidad)}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      aria-label="Menos"
                      onClick={() => cambiar(it.uid, { cantidad: Math.max(1, it.cantidad - 1) })}
                      className="h-11 w-11 rounded-lg bg-sunken text-lg"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-lg font-semibold">{it.cantidad}</span>
                    <button
                      aria-label="Más"
                      onClick={() => cambiar(it.uid, { cantidad: it.cantidad + 1 })}
                      className="h-11 w-11 rounded-lg bg-sunken text-lg"
                    >
                      +
                    </button>
                    <button
                      onClick={() => alternarEdicion(it.uid)}
                      aria-expanded={abierto}
                      className="ml-auto inline-flex min-h-11 items-center px-2 text-sm text-accent-text"
                    >
                      {abierto ? 'Listo' : 'Cambiar precio'}
                    </button>
                    <button
                      aria-label="Quitar"
                      onClick={() => quitar(it.uid)}
                      className="flex min-h-11 min-w-11 items-center justify-center text-xl text-muted"
                    >
                      ×
                    </button>
                  </div>
                  {abierto && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <label>
                        ml
                        <input
                          className="mt-1 w-full rounded-lg border border-line-strong bg-surface p-2.5"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={it.ml}
                          onChange={(e) => cambiar(it.uid, { ml: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        Precio c/u
                        <input
                          className="mt-1 w-full rounded-lg border border-line-strong bg-surface p-2.5"
                          type="number"
                          inputMode="numeric"
                          value={it.precioUnitario}
                          onChange={(e) => cambiar(it.uid, { precioUnitario: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {advertencias.map((a) => (
        <p key={a} className="mt-3 rounded-lg bg-warn-soft p-3 text-sm text-warn">
          {a} Se puede vender igual y corregir después con un ajuste de stock.
        </p>
      ))}

      {/* Pago */}
      <div className="mt-5 rounded-xl bg-surface p-3 shadow-sm">
        <label className="flex min-h-11 items-center justify-between gap-3 text-base font-medium">
          Pagó ahora
          <input
            type="checkbox"
            role="switch"
            className="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-line-strong transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-6 before:w-6 before:rounded-full before:bg-white before:transition-transform before:content-[''] checked:bg-primary checked:before:translate-x-5"
            checked={pagoAhora}
            onChange={(e) => setPagoAhora(e.target.checked)}
          />
        </label>
        {pagoAhora && (
          <div className="mt-2">
            <div role="group" aria-label="Monto pagado" className="grid grid-cols-3 gap-2">
              {(
                [
                  ['todo', 'Todo'],
                  ['mitad', 'Mitad'],
                  ['otro', 'Otro monto'],
                ] as const
              ).map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={modoPago === valor}
                  onClick={() => setModoPago(valor)}
                  className={`min-h-11 rounded-lg px-2 text-sm font-medium ${modoPago === valor ? 'bg-pill text-on-pill' : 'bg-sunken'}`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            {modoPago === 'otro' && (
              <input
                className={`${campo} mt-2`}
                type="number"
                inputMode="numeric"
                placeholder="Monto pagado"
                value={montoOtro}
                onChange={(e) => setMontoOtro(e.target.value)}
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-3">
        {notaAbierta ? (
          <input
            className={campo}
            placeholder="Nota (opcional)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        ) : (
          <button
            onClick={() => setNotaAbierta(true)}
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text"
          >
            + Agregar nota
          </button>
        )}
      </div>

      {/* Barra fija: total y guardar siempre a la vista */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-xl px-4 py-3">
          {error && (
            <p role="alert" className="mb-2 text-sm text-debt">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted">Total</div>
              <div className="text-2xl font-bold leading-tight" data-testid="total">
                {formatoMonto(total)}
              </div>
              {pagoAhora && total > 0 && (
                <div className="truncate text-xs text-muted">
                  Paga {formatoMonto(pagado)}
                  {total - pagado !== 0 &&
                    (total - pagado > 0
                      ? ` · queda ${formatoMonto(total - pagado)}`
                      : ` · a favor ${formatoMonto(pagado - total)}`)}
                </div>
              )}
            </div>
            <button
              onClick={guardar}
              disabled={guardando}
              className="min-h-12 rounded-lg bg-primary px-6 text-lg font-semibold text-on-primary disabled:opacity-50"
            >
              Guardar venta
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
