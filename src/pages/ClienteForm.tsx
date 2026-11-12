import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import type { Cliente } from '../db/tipos'

const campo = 'mt-1 w-full rounded-lg border border-line-strong bg-surface p-3 text-base'

export default function ClienteForm() {
  const { id } = useParams()
  const existente = useLiveQuery(() => (id ? db.clientes.get(id) : undefined), [id])
  if (id && !existente) return null
  return <Formulario key={existente?.id ?? 'nuevo'} existente={existente} />
}

function Formulario({ existente }: { existente?: Cliente }) {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState(existente?.nombre ?? '')
  const [telefono, setTelefono] = useState(existente?.telefono ?? '')
  const [nota, setNota] = useState(existente?.nota ?? '')
  const [error, setError] = useState('')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return setError('Escribir el nombre.')
    const datos = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      nota: nota.trim() || undefined,
    }
    if (existente) {
      await db.clientes.update(existente.id, datos)
      navigate(`/clientes/${existente.id}`, { replace: true })
    } else {
      const nuevo: Cliente = {
        id: crypto.randomUUID(),
        ...datos,
        creadoEn: new Date().toISOString(),
      }
      await db.clientes.add(nuevo)
      navigate(`/clientes/${nuevo.id}`, { replace: true })
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">{existente ? 'Editar cliente' : 'Nuevo cliente'}</h1>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        <label className="block text-sm font-medium">
          Nombre
          <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Teléfono (opcional, con código de país)
          <input
            className={campo}
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Nota (opcional)
          <textarea className={campo} value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>
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
