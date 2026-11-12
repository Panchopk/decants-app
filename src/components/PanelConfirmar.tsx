import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export interface OpcionesConfirmar {
  titulo: string
  descripcion?: string
  /** Texto del botón que confirma, con el verbo de la acción ("Anular venta"). */
  confirmar: string
  /** Acción destructiva: el botón se pinta de rojo. */
  peligro?: boolean
}

interface Pendiente extends OpcionesConfirmar {
  resolver: (acepta: boolean) => void
}

/**
 * Reemplazo de `confirm()`: un panel inferior propio.
 * Uso: `const { confirmar, panel } = useConfirmar()`, luego `if (await confirmar({...})) ...`
 * y render del `panel` en la pantalla.
 */
export function useConfirmar(): {
  confirmar: (o: OpcionesConfirmar) => Promise<boolean>
  panel: ReactNode
} {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)

  const confirmar = useCallback(
    (o: OpcionesConfirmar) => new Promise<boolean>((resolver) => setPendiente({ ...o, resolver })),
    [],
  )

  const cerrar = (acepta: boolean) => {
    pendiente?.resolver(acepta)
    setPendiente(null)
  }

  return {
    confirmar,
    panel: pendiente ? <Panel {...pendiente} onCerrar={cerrar} /> : null,
  }
}

function Panel({
  titulo,
  descripcion,
  confirmar,
  peligro,
  onCerrar,
}: Pendiente & { onCerrar: (acepta: boolean) => void }) {
  const cancelar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelar.current?.focus()
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar(false)
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onCerrar(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-titulo"
        className="relative w-full max-w-xl rounded-t-2xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <h2 id="panel-titulo" className="text-lg font-bold">
          {titulo}
        </h2>
        {descripcion && <p className="mt-1 text-muted">{descripcion}</p>}
        <div className="mt-4 grid gap-2">
          <button
            onClick={() => onCerrar(true)}
            className={`min-h-12 rounded-lg px-4 font-semibold text-white ${peligro ? 'bg-debt-btn' : 'bg-primary text-on-primary'}`}
          >
            {confirmar}
          </button>
          <button ref={cancelar} onClick={() => onCerrar(false)} className="min-h-12 rounded-lg bg-sunken px-4 font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
