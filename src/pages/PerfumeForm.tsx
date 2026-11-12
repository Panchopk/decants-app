import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import type { Perfume } from '../db/tipos'

interface FilaPrecio {
  ml: string
  precio: string
}

const campo = 'mt-1 w-full rounded-lg border border-line-strong bg-surface p-3 text-base'

export default function PerfumeForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const existente = useLiveQuery(() => (id ? db.perfumes.get(id) : undefined), [id])

  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [mlIniciales, setMlIniciales] = useState('')
  const [costo, setCosto] = useState('')
  const [precios, setPrecios] = useState<FilaPrecio[]>([
    { ml: '3', precio: '' },
    { ml: '5', precio: '' },
    { ml: '10', precio: '' },
  ])
  const [error, setError] = useState('')
  const [cargado, setCargado] = useState(!editando)

  useEffect(() => {
    if (existente && !cargado) {
      setNombre(existente.nombre)
      setMarca(existente.marca ?? '')
      setMlIniciales(String(existente.mlIniciales))
      setCosto(existente.costoBotella != null ? String(existente.costoBotella) : '')
      setPrecios(existente.precios.map((p) => ({ ml: String(p.ml), precio: String(p.precio) })))
      setCargado(true)
    }
  }, [existente, cargado])

  function cambiarPrecio(i: number, parte: keyof FilaPrecio, valor: string) {
    setPrecios((ps) => ps.map((p, j) => (j === i ? { ...p, [parte]: valor } : p)))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const ml = Number(mlIniciales)
    if (!nombre.trim()) return setError('Escribe el nombre.')
    if (!(ml > 0)) return setError('Los ml de la botella deben ser mayores a 0.')

    const preciosValidos = precios
      .filter((p) => p.ml.trim() !== '' || p.precio.trim() !== '')
      .map((p) => ({ ml: Number(p.ml), precio: Math.round(Number(p.precio)) }))
    if (preciosValidos.some((p) => !(p.ml > 0) || !(p.precio >= 0) || Number.isNaN(p.precio))) {
      return setError('Cada tamaño necesita ml y precio válidos.')
    }
    preciosValidos.sort((a, b) => a.ml - b.ml)

    const datos = {
      nombre: nombre.trim(),
      marca: marca.trim() || undefined,
      mlIniciales: ml,
      costoBotella: costo.trim() !== '' ? Math.round(Number(costo)) : undefined,
      precios: preciosValidos,
    }

    if (editando && existente) {
      await db.perfumes.update(existente.id, datos)
      navigate(`/perfumes/${existente.id}`, { replace: true })
    } else {
      const nuevo: Perfume = {
        id: crypto.randomUUID(),
        ...datos,
        archivado: false,
        creadoEn: new Date().toISOString(),
      }
      await db.perfumes.add(nuevo)
      navigate(`/perfumes/${nuevo.id}`, { replace: true })
    }
  }

  if (editando && !existente) return null

  return (
    <section>
      <h1 className="text-2xl font-bold">{editando ? 'Editar perfume' : 'Nuevo perfume'}</h1>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        <label className="block text-sm font-medium">
          Nombre
          <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Marca (opcional)
          <input className={campo} value={marca} onChange={(e) => setMarca(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Tamaño de la botella (ml)
          <input
            className={campo}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={mlIniciales}
            onChange={(e) => setMlIniciales(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Costo de la botella (opcional)
          <input
            className={campo}
            type="number"
            inputMode="numeric"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
          />
        </label>

        <div>
          <div className="text-sm font-medium">Precios por tamaño</div>
          <div className="mt-1 space-y-2">
            {precios.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label="ml"
                  className="w-20 rounded-lg border border-line-strong bg-surface p-3"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={p.ml}
                  onChange={(e) => cambiarPrecio(i, 'ml', e.target.value)}
                />
                <span className="text-muted">ml</span>
                <input
                  aria-label="precio"
                  className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface p-3"
                  type="number"
                  inputMode="numeric"
                  placeholder="Precio"
                  value={p.precio}
                  onChange={(e) => cambiarPrecio(i, 'precio', e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Quitar tamaño"
                  onClick={() => setPrecios((ps) => ps.filter((_, j) => j !== i))}
                  className="px-3 py-2 text-xl text-muted"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPrecios((ps) => [...ps, { ml: '', precio: '' }])}
            className="mt-2 text-sm font-medium text-accent-text"
          >
            + Agregar tamaño
          </button>
        </div>

        {error && <p className="text-sm text-debt">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-lg bg-sunken p-3 font-medium"
          >
            Cancelar
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-primary p-3 font-medium text-on-primary">
            Guardar
          </button>
        </div>
      </form>
    </section>
  )
}
