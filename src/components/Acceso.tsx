import { useState, type ReactNode } from 'react'
import { accesoRequerido, tieneAcceso } from '../lib/acceso'
import PantallaClave from './PantallaClave'

/**
 * Compuerta de entrada: sin clave configurada, la app abre libremente.
 * Con clave, se pide una vez por dispositivo; la app (y sus datos) no se cargan hasta entrar.
 */
export default function Acceso({ children }: { children: ReactNode }) {
  const [dentro, setDentro] = useState(() => !accesoRequerido() || tieneAcceso())
  if (!dentro) return <PantallaClave onEntrar={() => setDentro(true)} />
  return <>{children}</>
}
