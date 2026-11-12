import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BarraStock from '../components/BarraStock'
import { db } from '../db/db'
import { useUmbralStockBajo } from '../db/hooks'
import { mlRestantes, tieneStockBajo } from '../lib/calculos'
import { formatoFecha, formatoMl, formatoMonto } from '../lib/formato'

export default function PerfumeDetalle() {
  const { id = '' } = useParams()
  const umbral = useUmbralStockBajo()
  const [ajustando, setAjustando] = useState(false)
  const [mlAjuste, setMlAjuste] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const datos = useLiveQuery(async () => {
    const perfume = await db.perfumes.get(id)
    const [ventas, ajustes, clientes] = await Promise.all([
      db.ventas.toArray(),
      db.ajustes.where('perfumeId').equals(id).toArray(),
      db.clientes.toArray(),
    ])
    return { perfume, ventas, ajustes, clientes }
  }, [id])

  if (!datos) return null
  const { perfume, ventas, ajustes, clientes } = datos
  if (!perfume) {
    return (
      <section>
        <p>Perfume no encontrado.</p>
        <Link to="/perfumes" className="inline-flex min-h-11 items-center text-accent-text">
          Volver
        </Link>
      </section>
    )
  }

  const rest = mlRestantes(perfume.id, perfume.mlIniciales, ventas, ajustes)
  const ventasDelPerfume = ventas
    .filter((v) => v.items.some((i) => i.perfumeId === perfume.id))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const nombreCliente = (cid: string) => clientes.find((c) => c.id === cid)?.nombre ?? 'Cliente'

  async function guardarAjuste(e: React.FormEvent) {
    e.preventDefault()
    const ml = Number(mlAjuste)
    if (!mlAjuste.trim() || Number.isNaN(ml) || ml === 0) {
      return setError('Escribe los ml a ajustar (negativo para restar).')
    }
    await db.ajustes.add({
      id: crypto.randomUUID(),
      perfumeId: perfume!.id,
      ml,
      motivo: motivo.trim() || (ml < 0 ? 'Merma' : 'Corrección'),
      fecha: new Date().toISOString(),
    })
    setMlAjuste('')
    setMotivo('')
    setError('')
    setAjustando(false)
  }

  async function alternarArchivo() {
    const accion = perfume!.archivado ? 'restaurar' : 'archivar'
    if (confirm(`¿Quieres ${accion} "${perfume!.nombre}"?`)) {
      await db.perfumes.update(perfume!.id, { archivado: !perfume!.archivado })
    }
  }

  return (
    <section>
      <Link to="/perfumes" className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm text-accent-text">
        ← Perfumes
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{perfume.nombre}</h1>
      {perfume.marca && <p className="text-muted">{perfume.marca}</p>}
      {perfume.archivado && (
        <p className="mt-2 inline-block rounded bg-warn-soft px-2 py-1 text-sm text-warn">
          Archivado
        </p>
      )}

      <div className="mt-4 rounded-xl bg-surface p-4 shadow-sm">
        <BarraStock
          restantes={rest}
          iniciales={perfume.mlIniciales}
          bajo={tieneStockBajo(rest, umbral)}
        />
        <p className="mt-3 text-2xl font-bold" data-testid="ml-restantes">
          {formatoMl(rest)} ml restantes
        </p>
      </div>

      <h2 className="mt-6 font-semibold">Precios</h2>
      {perfume.precios.length === 0 ? (
        <p className="text-sm text-muted">Sin precios definidos.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {perfume.precios.map((p) => (
            <li key={p.ml} className="rounded-lg bg-surface px-3 py-2 text-sm shadow-sm">
              {formatoMl(p.ml)} ml · {formatoMonto(p.precio)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setAjustando((a) => !a)}
          className="rounded-lg bg-primary p-3 font-medium text-on-primary"
        >
          Ajustar stock
        </button>
        <Link
          to={`/perfumes/${perfume.id}/editar`}
          className="rounded-lg bg-sunken p-3 text-center font-medium"
        >
          Editar
        </Link>
      </div>

      {ajustando && (
        <form onSubmit={guardarAjuste} className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-sm">
          <label className="block text-sm font-medium">
            ml a ajustar (negativo = merma o derrame)
            <input
              className="mt-1 w-full rounded-lg border border-line-strong p-3"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={mlAjuste}
              onChange={(e) => setMlAjuste(e.target.value)}
              placeholder="-5"
            />
          </label>
          <label className="block text-sm font-medium">
            Motivo (opcional)
            <input
              className="mt-1 w-full rounded-lg border border-line-strong p-3"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-debt">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-primary p-3 font-medium text-on-primary">
            Guardar ajuste
          </button>
        </form>
      )}

      {ajustes.length > 0 && (
        <>
          <h2 className="mt-6 font-semibold">Ajustes de stock</h2>
          <ul className="mt-2 space-y-2">
            {[...ajustes]
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .map((a) => (
                <li key={a.id} className="flex justify-between rounded-lg bg-surface p-3 text-sm shadow-sm">
                  <span>
                    {a.motivo}
                    <span className="block text-muted">{formatoFecha(a.fecha)}</span>
                  </span>
                  <span className={a.ml < 0 ? 'text-debt' : 'text-credit'}>
                    {a.ml > 0 ? '+' : ''}
                    {formatoMl(a.ml)} ml
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}

      <h2 className="mt-6 font-semibold">Historial de ventas</h2>
      {ventasDelPerfume.length === 0 ? (
        <p className="text-sm text-muted">Aún no se ha vendido.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {ventasDelPerfume.map((v) => (
            <li
              key={v.id}
              className={`rounded-lg bg-surface p-3 text-sm shadow-sm ${v.anulada ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between">
                <span>{nombreCliente(v.clienteId)}</span>
                <span className="text-muted">{formatoFecha(v.fecha)}</span>
              </div>
              {v.items
                .filter((i) => i.perfumeId === perfume.id)
                .map((i, k) => (
                  <div key={k} className="text-strong">
                    {i.cantidad} × {formatoMl(i.ml)} ml
                    {v.anulada && ' · anulada'}
                  </div>
                ))}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={alternarArchivo}
        className="mt-8 w-full rounded-lg border border-line-strong p-3 font-medium text-strong"
      >
        {perfume.archivado ? 'Restaurar perfume' : 'Archivar perfume'}
      </button>
    </section>
  )
}
