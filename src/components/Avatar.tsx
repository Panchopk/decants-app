/** Iniciales del nombre (hasta dos letras) dentro de un círculo. */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  const letras = palabras.length === 1 ? palabras[0].slice(0, 2) : palabras[0][0] + palabras[1][0]
  return letras.toUpperCase()
}

export default function Avatar({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-soft-ink ${
        grande ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm'
      }`}
    >
      {iniciales(nombre)}
    </span>
  )
}
