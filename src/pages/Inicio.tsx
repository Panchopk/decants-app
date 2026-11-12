import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import BarraStock from '../components/BarraStock'
import { db } from '../db/db'
import { useUmbralStockBajo } from '../db/hooks'
import { mlRestantes, saldoCliente, tieneStockBajo, totalPorCobrar } from '../lib/calculos'
import { formatoMonto } from '../lib/formato'

export default function Inicio() {
  const umbral = useUmbralStockBajo()
  const datos = useLiveQuery(async () => {
    const [clientes, perfumes, ventas, pagos, ajustes] = await Promise.all([
      db.clientes.toArray(),
      db.perfumes.toArray(),
      db.ventas.toArray(),
      db.pagos.toArray(),
      db.ajustes.toArray(),
    ])
    return { clientes, perfumes, ventas, pagos, ajustes }
  })

  if (!datos) return null
  const { clientes, perfumes, ventas, pagos, ajustes } = datos

  const porCobrar = totalPorCobrar(
    clientes.map((c) => c.id),
    ventas,
    pagos,
  )
  const deudores = clientes
    .map((c) => ({ c, saldo: saldoCliente(c.id, ventas, pagos) }))
    .filter((x) => x.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
  const stockBajo = perfumes
    .filter((p) => !p.archivado)
    .map((p) => ({ p, rest: mlRestantes(p.id, p.mlIniciales, ventas, ajustes) }))
    .filter((x) => tieneStockBajo(x.rest, umbral))
    .sort((a, b) => a.rest - b.rest)

  return (
    <section>
      <h1 className="text-2xl font-bold">Inicio</h1>

      <div className="mt-4 rounded-xl bg-indigo-600 p-5 text-white shadow-sm">
        <div className="text-sm opacity-80">Total por cobrar</div>
        <div className="text-3xl font-bold" data-testid="por-cobrar">
          {formatoMonto(porCobrar)}
        </div>
      </div>

      <h2 className="mt-6 font-semibold">Quién te debe</h2>
      {deudores.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nadie te debe nada. 🎉</p>
      ) : (
        <ul className="mt-2 space-y-2" data-testid="deudores">
          {deudores.map(({ c, saldo }) => (
            <li key={c.id}>
              <Link
                to={`/clientes/${c.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
              >
                <span className="font-medium">{c.nombre}</span>
                <span className="font-semibold text-red-600">{formatoMonto(saldo)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 font-semibold">Stock bajo</h2>
      {stockBajo.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Todos los perfumes tienen stock suficiente.</p>
      ) : (
        <ul className="mt-2 space-y-2" data-testid="stock-bajo">
          {stockBajo.map(({ p, rest }) => (
            <li key={p.id}>
              <Link to={`/perfumes/${p.id}`} className="block rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-2 font-medium">{p.nombre}</div>
                <BarraStock restantes={rest} iniciales={p.mlIniciales} bajo />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
