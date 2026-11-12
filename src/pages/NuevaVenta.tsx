import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import type { Cliente, ItemVenta, Pago, Venta } from '../db/tipos'
import { mlRestantes, saldoCliente, totalVenta } from '../lib/calculos'
import { formatoMl, formatoMonto } from '../lib/formato'

const campo = 'w-full rounded-lg border border-line-strong bg-surface p-3 text-base'

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
  const [items, setItems] = useState<ItemVenta[]>([])
  const [perfumeElegido, setPerfumeElegido] = useState('')
  const [pagoAhora, setPagoAhora] = useState(false)
  const [montoPago, setMontoPago] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!datos) return null
  const { clientes, perfumes, ventas, ajustes, pagos } = datos
  const activos = perfumes
    .filter((p) => !p.archivado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const nombrePerfume = (id: string) => perfumes.find((p) => p.id === id)?.nombre ?? 'Perfume'
  const total = totalVenta(items)

  const q = busqueda.trim().toLowerCase()
  const coincidencias = q
    ? clientes.filter((c) => c.nombre.toLowerCase().includes(q)).slice(0, 6)
    : []
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

  function agregarItem(perfumeId: string, ml: number, precio: number) {
    setItems((its) => {
      // Si ya existe el mismo perfume + tamaño + precio, suma cantidad
      const i = its.findIndex(
        (x) => x.perfumeId === perfumeId && x.ml === ml && x.precioUnitario === precio,
      )
      if (i >= 0) return its.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x))
      return [...its, { perfumeId, ml, cantidad: 1, precioUnitario: precio }]
    })
  }

  function cambiarItem(i: number, cambio: Partial<ItemVenta>) {
    setItems((its) => its.map((x, j) => (j === i ? { ...x, ...cambio } : x)))
  }

  // Advertencias de stock: ml que quedarían tras esta venta
  const advertencias = [...new Set(items.map((i) => i.perfumeId))]
    .map((pid) => {
      const p = perfumes.find((x) => x.id === pid)
      if (!p) return null
      const actual = mlRestantes(pid, p.mlIniciales, ventas, ajustes)
      const usado = items.filter((i) => i.perfumeId === pid).reduce((s, i) => s + i.ml * i.cantidad, 0)
      return actual - usado < 0
        ? `${p.nombre}: quedan ${formatoMl(actual)} ml y estás vendiendo ${formatoMl(usado)} ml.`
        : null
    })
    .filter(Boolean) as string[]

  const saldoPrevio = cliente ? saldoCliente(cliente.id, ventas, pagos) : 0

  async function guardar() {
    if (!cliente) return setError('Elige un cliente.')
    if (items.length === 0) return setError('Agrega al menos un perfume.')
    if (items.some((i) => !(i.ml > 0) || !(i.cantidad >= 1) || !(i.precioUnitario >= 0)))
      return setError('Revisa los ml, cantidades y precios.')
    const pagado = pagoAhora ? Math.round(Number(montoPago === '' ? total : montoPago)) : 0
    if (pagoAhora && (Number.isNaN(pagado) || pagado < 0)) return setError('Monto de pago inválido.')

    setGuardando(true)
    const ahora = new Date().toISOString()
    const venta: Venta = {
      id: crypto.randomUUID(),
      clienteId: cliente.id,
      fecha: ahora,
      nota: nota.trim() || undefined,
      items: items.map((i) => ({ ...i, precioUnitario: Math.round(i.precioUnitario) })),
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

  const perfumeSel = activos.find((p) => p.id === perfumeElegido)

  return (
    <section>
      <h1 className="text-2xl font-bold">Nueva venta</h1>

      {/* Cliente */}
      <h2 className="mt-4 text-sm font-medium">Cliente</h2>
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
          <button onClick={() => setCliente(null)} className="px-2 py-1 text-sm text-accent-text">
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
          <ul className="mt-2 space-y-2">
            {coincidencias.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setCliente(c)
                    setBusqueda('')
                  }}
                  className="w-full rounded-lg bg-surface p-3 text-left shadow-sm"
                >
                  {c.nombre}
                </button>
              </li>
            ))}
            {q && !hayExacto && (
              <li>
                <button
                  onClick={crearCliente}
                  className="w-full rounded-lg border border-dashed border-primary-edge p-3 text-left text-accent-text"
                >
                  + Crear cliente "{busqueda.trim()}"
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Items */}
      <h2 className="mt-6 text-sm font-medium">Perfumes</h2>
      {activos.length === 0 ? (
        <p className="mt-1 text-sm text-muted">Primero crea un perfume en la pestaña Perfumes.</p>
      ) : (
        <>
          <select
            className={`${campo} mt-1`}
            value={perfumeElegido}
            onChange={(e) => setPerfumeElegido(e.target.value)}
          >
            <option value="">Elegir perfume…</option>
            {activos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.marca ? ` · ${p.marca}` : ''}
              </option>
            ))}
          </select>
          {perfumeSel && (
            <div className="mt-2 flex flex-wrap gap-2">
              {perfumeSel.precios.map((pr) => (
                <button
                  key={pr.ml}
                  onClick={() => agregarItem(perfumeSel.id, pr.ml, pr.precio)}
                  className="rounded-lg bg-primary-soft px-4 py-3 font-medium text-primary-soft-ink"
                >
                  {formatoMl(pr.ml)} ml · {formatoMonto(pr.precio)}
                </button>
              ))}
              <button
                onClick={() => agregarItem(perfumeSel.id, 1, 0)}
                className="rounded-lg bg-sunken px-4 py-3 font-medium"
              >
                Otro tamaño
              </button>
            </div>
          )}
        </>
      )}

      <ul className="mt-3 space-y-3">
        {items.map((it, i) => (
          <li key={i} className="rounded-xl bg-surface p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{nombrePerfume(it.perfumeId)}</span>
              <button
                aria-label="Quitar"
                onClick={() => setItems((its) => its.filter((_, j) => j !== i))}
                className="px-2 text-xl text-muted"
              >
                ×
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <label>
                ml
                <input
                  className="mt-1 w-full rounded-lg border border-line-strong p-2"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={it.ml}
                  onChange={(e) => cambiarItem(i, { ml: Number(e.target.value) })}
                />
              </label>
              <label>
                Cantidad
                <div className="mt-1 flex items-center">
                  <button
                    aria-label="Menos"
                    onClick={() => cambiarItem(i, { cantidad: Math.max(1, it.cantidad - 1) })}
                    className="h-10 w-10 rounded-lg bg-sunken text-lg"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center">{it.cantidad}</span>
                  <button
                    aria-label="Más"
                    onClick={() => cambiarItem(i, { cantidad: it.cantidad + 1 })}
                    className="h-10 w-10 rounded-lg bg-sunken text-lg"
                  >
                    +
                  </button>
                </div>
              </label>
              <label>
                Precio c/u
                <input
                  className="mt-1 w-full rounded-lg border border-line-strong p-2"
                  type="number"
                  inputMode="numeric"
                  value={it.precioUnitario}
                  onChange={(e) => cambiarItem(i, { precioUnitario: Number(e.target.value) })}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {advertencias.map((a) => (
        <p key={a} className="mt-3 rounded-lg bg-warn-soft p-3 text-sm text-warn">
          ⚠ {a} Puedes vender igual y corregir con un ajuste de stock.
        </p>
      ))}

      {/* Total y pago */}
      <div className="mt-6 flex items-center justify-between text-xl font-bold">
        <span>Total</span>
        <span data-testid="total">{formatoMonto(total)}</span>
      </div>

      <label className="mt-4 flex items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          className="h-6 w-6"
          checked={pagoAhora}
          onChange={(e) => {
            setPagoAhora(e.target.checked)
            setMontoPago('')
          }}
        />
        Pagó ahora
      </label>
      {pagoAhora && (
        <label className="mt-2 block text-sm font-medium">
          Monto pagado (deja vacío para el total, o escribe un abono)
          <input
            className={`${campo} mt-1`}
            type="number"
            inputMode="numeric"
            placeholder={String(total)}
            value={montoPago}
            onChange={(e) => setMontoPago(e.target.value)}
          />
        </label>
      )}

      <label className="mt-4 block text-sm font-medium">
        Nota (opcional)
        <input className={`${campo} mt-1`} value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>

      {error && <p className="mt-3 text-sm text-debt">{error}</p>}

      <button
        onClick={guardar}
        disabled={guardando}
        className="mt-4 w-full rounded-lg bg-primary p-4 text-lg font-semibold text-on-primary disabled:opacity-50"
      >
        Guardar venta
      </button>
    </section>
  )
}
