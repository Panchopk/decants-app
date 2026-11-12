export type Tema = 'auto' | 'claro' | 'oscuro'
export type TemaAplicado = 'claro' | 'oscuro'

const CLAVE = 'tema'
const COLOR_BARRA: Record<TemaAplicado, string> = { claro: '#4f46e5', oscuro: '#0f172a' }

/** Tema que se ve: "auto" sigue la preferencia del celular. */
export function resolverTema(tema: Tema, prefiereOscuro: boolean): TemaAplicado {
  if (tema === 'auto') return prefiereOscuro ? 'oscuro' : 'claro'
  return tema
}

export function leerTema(): Tema {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'claro' || v === 'oscuro' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

const mediaOscuro = () => window.matchMedia('(prefers-color-scheme: dark)')

export function aplicarTema(tema: Tema): void {
  const aplicado = resolverTema(tema, mediaOscuro().matches)
  document.documentElement.dataset.tema = aplicado
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[aplicado])
}

export function guardarTema(tema: Tema): void {
  try {
    if (tema === 'auto') localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, tema)
  } catch {
    // Sin almacenamiento: el tema vale solo hasta cerrar la app
  }
  aplicarTema(tema)
}

/** Aplica el tema guardado y sigue los cambios del celular si está en "auto". */
export function iniciarTema(): void {
  aplicarTema(leerTema())
  mediaOscuro().addEventListener('change', () => {
    if (leerTema() === 'auto') aplicarTema('auto')
  })
}
