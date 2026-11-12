let simboloMoneda = ''

/** Símbolo que se antepone a los montos (configurable en Ajustes). */
export function setSimboloMoneda(s: string): void {
  simboloMoneda = s.trim()
}

/** Monto con separador de miles (es-CO usa punto) y símbolo opcional. Sin decimales. */
export function formatoMonto(n: number): string {
  const num = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.abs(n))
  return `${n < 0 ? '-' : ''}${simboloMoneda}${num}`
}

/** ml con hasta un decimal. */
export function formatoMl(n: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(n)
}

export function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Día local (AAAA-MM-DD) para agrupar movimientos. */
export function claveDia(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "Hoy", "Ayer" o la fecha. */
export function etiquetaDia(iso: string, ahora: Date = new Date()): string {
  const clave = claveDia(iso)
  if (clave === claveDia(ahora.toISOString())) return 'Hoy'
  const ayer = new Date(ahora)
  ayer.setDate(ayer.getDate() - 1)
  if (clave === claveDia(ayer.toISOString())) return 'Ayer'
  return formatoFecha(iso)
}
