import type { ReactNode } from 'react'

/** Íconos de trazo, 24 × 24, con el color del texto. Decorativos: la etiqueta va aparte. */
function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconoInicio = () => (
  <Icono>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-6h4v6" />
  </Icono>
)

export const IconoClientes = () => (
  <Icono>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.2a3.25 3.25 0 0 1 0 5.6" />
    <path d="M18 14.8c1.8.7 3 2.4 3 5.2" />
  </Icono>
)

export const IconoPerfumes = () => (
  <Icono>
    <rect x="10" y="2.75" width="4" height="3" rx="0.5" />
    <path d="M11 5.75v2.5M13 5.75v2.5" />
    <rect x="5.5" y="8.25" width="13" height="12.5" rx="2.5" />
    <path d="M9 13.5v3.5" />
  </Icono>
)

export const IconoAjustes = () => (
  <Icono>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Icono>
)

export const IconoMas = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
)
