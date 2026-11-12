import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import BarraStock from '../components/BarraStock'
import EstadoVacio from '../components/EstadoVacio'
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

  // Primer uso: sin perfumes ni clientes, indicar por dónde empezar
  if (perfumes.length === 0 && clientes.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-bold">Inicio</h1>
        <EstadoVacio
          titulo="Empezar"
          texto="Registrar un perfume y después la primera venta. Aquí se verá cuánto hay por cobrar y qué perfumes se están acabando."
          accion={{ etiqueta: 'Crear el primer perfume', to: '/perfumes/nuevo' }}
        />
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Inicio</h1>

      <div className="mt-4 rounded-xl bg-primary p-5 text-on-primary shadow-sm">
        <div className="text-sm opacity-80">Total por cobrar</div>
        <div className="text-3xl font-bold" data-testid="por-cobrar">
          {formatoMonto(porCobrar)}
        </div>
      </div>

      <h2 className="mt-6 font-semibold">Deudores</h2>
      {deudores.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No hay deudas pendientes.</p>
      ) : (
        <ul className="mt-2 space-y-2" data-testid="deudores">
          {deudores.map(({ c, saldo }) => (
            <li key={c.id}>
              <Link
                to={`/clientes/${c.id}`}
                className="flex min-h-14 items-center gap-3 rounded-xl bg-surface p-3 shadow-sm"
              >
                <Avatar nombre={c.nombre} />
                <span className="min-w-0 flex-1 truncate font-medium">{c.nombre}</span>
                <span className="font-semibold text-debt">{formatoMonto(saldo)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 font-semibold">Stock bajo</h2>
      {stockBajo.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Todos los perfumes tienen stock suficiente.</p>
      ) : (
        <ul className="mt-2 space-y-2" data-testid="stock-bajo">
          {stockBajo.map(({ p, rest }) => (
            <li key={p.id}>
              <Link to={`/perfumes/${p.id}`} className="block rounded-xl bg-surface p-4 shadow-sm">
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
