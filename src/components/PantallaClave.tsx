import { useEffect, useState } from 'react'
import { concederAcceso, registrarFallo, segundosBloqueado, verificarClave } from '../lib/acceso'

/** Pide la clave de acceso. Se muestra una sola vez por dispositivo. */
export default function PantallaClave({ onEntrar }: { onEntrar: () => void }) {
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [espera, setEspera] = useState(() => segundosBloqueado())

  // Cuenta regresiva mientras el acceso está bloqueado por intentos fallidos
  useEffect(() => {
    if (espera <= 0) return
    const t = window.setInterval(() => setEspera(segundosBloqueado()), 500)
    return () => window.clearInterval(t)
  }, [espera])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (verificando || espera > 0 || clave === '') return
    setVerificando(true)
    setError('')
    const ok = await verificarClave(clave)
    if (ok) {
      concederAcceso()
      onEntrar()
      return
    }
    setVerificando(false)
    setClave('')
    const segundos = registrarFallo()
    setEspera(segundos)
    setError('Clave incorrecta.')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-bold">Decants</h1>
      <p className="mt-1 text-muted">Ingresar la clave de acceso. Se pide una sola vez en este dispositivo.</p>

      <form onSubmit={entrar} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">
          Clave
          <div className="mt-1 flex gap-2">
            <input
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface p-3 text-base"
              type={ver ? 'text' : 'password'}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              aria-pressed={ver}
              className="min-h-12 rounded-lg bg-sunken px-3 text-sm font-medium"
            >
              {ver ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </label>

        {(error || espera > 0) && (
          <p role="alert" className="text-sm text-debt">
            {espera > 0 ? `Demasiados intentos. Esperar ${espera} s para volver a probar.` : error}
          </p>
        )}

        <button
          type="submit"
          disabled={verificando || espera > 0 || clave === ''}
          className="min-h-12 w-full rounded-lg bg-primary font-semibold text-on-primary disabled:opacity-50"
        >
          {verificando ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
