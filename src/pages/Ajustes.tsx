import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useConfirmar } from '../components/PanelConfirmar'
import { db } from '../db/db'
import { useUmbralStockBajo } from '../db/hooks'
import { formatoFecha } from '../lib/formato'
import { exportarRespaldo, restaurarRespaldo, validarRespaldo } from '../lib/respaldo'
import { guardarTema, leerTema, type Tema } from '../lib/tema'

const TEMAS: { valor: Tema; etiqueta: string }[] = [
  { valor: 'auto', etiqueta: 'Automático' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
]

export default function Ajustes() {
  const { confirmar, panel } = useConfirmar()
  const umbral = useUmbralStockBajo()
  const [tema, setTema] = useState<Tema>(leerTema)
  const config = useLiveQuery(() => db.config.toArray())
  const simbolo = String(config?.find((c) => c.clave === 'simboloMoneda')?.valor ?? '')
  const ultimo = config?.find((c) => c.clave === 'ultimoRespaldo')?.valor
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  if (!config) return null

  async function exportar() {
    await exportarRespaldo()
    setMensaje({ tipo: 'ok', texto: 'Respaldo descargado. Guardarlo en un lugar seguro (Drive, correo, etc.).' })
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    let json: unknown
    try {
      json = JSON.parse(await archivo.text())
    } catch {
      return setMensaje({ tipo: 'error', texto: 'El archivo no es un JSON válido.' })
    }
    const res = validarRespaldo(json)
    if (!res.ok) return setMensaje({ tipo: 'error', texto: res.error })
    const r = res.respaldo
    const resumen = `${r.perfumes.length} perfumes, ${r.clientes.length} clientes, ${r.ventas.length} ventas, ${r.pagos.length} pagos`
    const si = await confirmar({
      titulo: '¿Reemplazar todos los datos?',
      descripcion: `Los datos actuales se reemplazan por los del respaldo (${resumen}). No se puede deshacer.`,
      confirmar: 'Reemplazar datos',
      peligro: true,
    })
    if (!si) return
    try {
      await restaurarRespaldo(r)
      setMensaje({ tipo: 'ok', texto: `Respaldo importado: ${resumen}.` })
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo importar. Los datos actuales no se modificaron.' })
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <h2 className="mt-6 font-semibold">Respaldo</h2>
      <p className="mt-1 text-sm text-muted">
        Los datos viven solo en este celular: conviene exportar un respaldo seguido.{' '}
        {typeof ultimo === 'string'
          ? `Último respaldo: ${formatoFecha(ultimo)}.`
          : 'Todavía no hay ningún respaldo.'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button onClick={exportar} className="rounded-lg bg-primary p-3 font-medium text-on-primary">
          Exportar
        </button>
        <label className="cursor-pointer rounded-lg bg-sunken p-3 text-center font-medium">
          Importar
          <input type="file" accept="application/json,.json" onChange={importar} className="hidden" />
        </label>
      </div>
      {mensaje && (
        <p
          role="status"
          className={`mt-3 rounded-lg p-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-credit-soft text-credit-ink' : 'bg-debt-soft text-debt-ink'}`}
        >
          {mensaje.texto}
        </p>
      )}

      <h2 className="mt-8 font-semibold">Apariencia</h2>
      <div role="group" aria-label="Tema" className="mt-3 grid grid-cols-3 gap-2">
        {TEMAS.map((t) => (
          <button
            key={t.valor}
            type="button"
            aria-pressed={tema === t.valor}
            onClick={() => {
              setTema(t.valor)
              guardarTema(t.valor)
            }}
            className={`rounded-lg p-3 text-sm font-medium ${tema === t.valor ? 'bg-pill text-on-pill' : 'bg-sunken'}`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">Automático sigue el tema del celular.</p>

      <h2 className="mt-8 font-semibold">Preferencias</h2>
      <label className="mt-3 block text-sm font-medium">
        Avisar de stock bajo cuando queden (ml) o menos
        <input
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface p-3"
          type="number"
          inputMode="decimal"
          min="0"
          value={umbral}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (e.target.value !== '' && n >= 0) db.config.put({ clave: 'umbralStockBajo', valor: n })
          }}
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Símbolo de moneda (opcional, ej. $)
        <input
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface p-3"
          maxLength={4}
          value={simbolo}
          onChange={(e) => db.config.put({ clave: 'simboloMoneda', valor: e.target.value })}
        />
      </label>
      {panel}
    </section>
  )
}
