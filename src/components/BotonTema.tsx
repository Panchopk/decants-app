import { useSyncExternalStore } from 'react'
import { guardarTema, type TemaAplicado } from '../lib/tema'
import { IconoLuna, IconoSol } from './Iconos'

/** Tema que se está viendo, leído del atributo que pone `aplicarTema` en <html>. */
function suscribir(aviso: () => void) {
  const obs = new MutationObserver(aviso)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
  return () => obs.disconnect()
}
const leer = (): TemaAplicado => (document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro')

/** Botón siempre visible para pasar de claro a oscuro y al revés. */
export default function BotonTema() {
  const tema = useSyncExternalStore(suscribir, leer)
  const siguiente: TemaAplicado = tema === 'oscuro' ? 'claro' : 'oscuro'
  return (
    <button
      type="button"
      onClick={() => guardarTema(siguiente)}
      aria-label={siguiente === 'oscuro' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      className="-mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted"
    >
      {tema === 'oscuro' ? <IconoSol /> : <IconoLuna />}
    </button>
  )
}
