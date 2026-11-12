import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface Aviso {
  id: number
  texto: string
  saliendo: boolean
}

const DURACION_MS = 3000
const SALIDA_MS = 200

const Contexto = createContext<(texto: string) => void>(() => {})

/** Aviso breve de confirmación: `const avisar = useAvisos(); avisar('Venta guardada')`. */
export const useAvisos = () => useContext(Contexto)

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const temporizadores = useRef<number[]>([])
  const contador = useRef(0)

  const limpiar = () => {
    temporizadores.current.forEach((t) => window.clearTimeout(t))
    temporizadores.current = []
  }

  const cerrar = useCallback((id: number) => {
    setAviso((a) => (a && a.id === id ? { ...a, saliendo: true } : a))
    temporizadores.current.push(
      window.setTimeout(() => setAviso((a) => (a && a.id === id ? null : a)), SALIDA_MS),
    )
  }, [])

  const avisar = useCallback(
    (texto: string) => {
      limpiar()
      const id = ++contador.current
      setAviso({ id, texto, saliendo: false })
      temporizadores.current.push(window.setTimeout(() => cerrar(id), DURACION_MS))
    },
    [cerrar],
  )

  useEffect(() => limpiar, [])

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4"
      >
        {aviso && (
          // Transición (no keyframes): si llega otro aviso se reemplaza sin saltos.
          <button
            key={aviso.id}
            type="button"
            onClick={() => cerrar(aviso.id)}
            className={`pointer-events-auto max-w-sm rounded-xl bg-pill px-4 py-3 text-left text-sm font-medium text-on-pill shadow-lg transition-[opacity,transform] duration-200 ease-fuerte starting:translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0 ${
              aviso.saliendo ? 'translate-y-2 opacity-0 motion-reduce:translate-y-0' : 'translate-y-0 opacity-100'
            }`}
          >
            {aviso.texto}
          </button>
        )}
      </div>
    </Contexto.Provider>
  )
}
