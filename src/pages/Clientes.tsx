import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import EstadoVacio from '../components/EstadoVacio'
import { EtiquetaSaldo } from '../components/Monto'
import { db } from '../db/db'
import { saldoCliente } from '../lib/calculos'

export default function Clientes() {
  const [busqueda, setBusqueda] = useState('')
  const [soloDeudores, setSoloDeudores] = useState(false)
  const datos = useLiveQuery(async () => {
    const [clientes, ventas, pagos] = await Promise.all([
      db.clientes.toArray(),
      db.ventas.toArray(),
      db.pagos.toArray(),
    ])
    return { clientes, ventas, pagos }
  })

  if (!datos) return null
  const q = busqueda.trim().toLowerCase()
  const lista = datos.clientes
    .map((c) => ({ c, saldo: saldoCliente(c.id, datos.ventas, datos.pagos) }))
    .filter(({ c }) => !q || c.nombre.toLowerCase().includes(q))
    .filter(({ saldo }) => !soloDeudores || saldo > 0)
    .sort((a, b) => b.saldo - a.saldo || a.c.nombre.localeCompare(b.c.nombre))

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link
          to="/clientes/nuevo"
          className="rounded-lg bg-primary px-4 py-3 font-medium text-on-primary"
        >
          Nuevo
        </Link>
      </div>

      <input
        type="search"
        placeholder="Buscar cliente"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mt-4 w-full rounded-lg border border-line-strong bg-surface p-3"
      />
      <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={soloDeudores}
          onChange={(e) => setSoloDeudores(e.target.checked)}
          className="h-5 w-5"
        />
        Solo deudores
      </label>

      {datos.clientes.length === 0 ? (
        <EstadoVacio
          titulo="Aún no hay clientes"
          texto="Cada cliente guarda lo que compra y lo que paga. También se pueden crear al armar una venta."
          accion={{ etiqueta: 'Crear cliente', to: '/clientes/nuevo' }}
        />
      ) : (
        lista.length === 0 && <p className="mt-6 text-muted">Sin resultados.</p>
      )}

      <ul className="mt-4 space-y-3">
        {lista.map(({ c, saldo }) => (
          <li key={c.id}>
            <Link
              to={`/clientes/${c.id}`}
              className="flex min-h-14 items-center gap-3 rounded-xl bg-surface p-3 shadow-sm"
            >
              <Avatar nombre={c.nombre} />
              <span className="min-w-0 flex-1 truncate font-semibold">{c.nombre}</span>
              <EtiquetaSaldo saldo={saldo} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
