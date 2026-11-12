import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import BarraStock from '../components/BarraStock'
import { db } from '../db/db'
import { useUmbralStockBajo } from '../db/hooks'
import { mlRestantes, tieneStockBajo } from '../lib/calculos'

export default function Perfumes() {
  const [verArchivados, setVerArchivados] = useState(false)
  const umbral = useUmbralStockBajo()
  const datos = useLiveQuery(async () => {
    const [perfumes, ventas, ajustes] = await Promise.all([
      db.perfumes.toArray(),
      db.ventas.toArray(),
      db.ajustes.toArray(),
    ])
    return { perfumes, ventas, ajustes }
  })

  if (!datos) return null
  const lista = datos.perfumes
    .filter((p) => p.archivado === verArchivados)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfumes</h1>
        <Link
          to="/perfumes/nuevo"
          className="rounded-lg bg-primary px-4 py-3 font-medium text-on-primary"
        >
          Nuevo
        </Link>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        <button
          onClick={() => setVerArchivados(false)}
          className={`min-h-11 rounded-full px-4 ${!verArchivados ? 'bg-pill text-on-pill' : 'bg-sunken'}`}
        >
          Activos
        </button>
        <button
          onClick={() => setVerArchivados(true)}
          className={`min-h-11 rounded-full px-4 ${verArchivados ? 'bg-pill text-on-pill' : 'bg-sunken'}`}
        >
          Archivados
        </button>
      </div>

      {lista.length === 0 && (
        <p className="mt-6 text-muted">
          {verArchivados ? 'No hay perfumes archivados.' : 'Aún no hay perfumes. Crea el primero.'}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {lista.map((p) => {
          const rest = mlRestantes(p.id, p.mlIniciales, datos.ventas, datos.ajustes)
          return (
            <li key={p.id}>
              <Link
                to={`/perfumes/${p.id}`}
                className="block rounded-xl bg-surface p-4 shadow-sm"
              >
                <div className="font-semibold">{p.nombre}</div>
                {p.marca && <div className="text-sm text-muted">{p.marca}</div>}
                <div className="mt-3">
                  <BarraStock
                    restantes={rest}
                    iniciales={p.mlIniciales}
                    bajo={tieneStockBajo(rest, umbral)}
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
