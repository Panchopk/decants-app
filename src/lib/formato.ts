/** Monto con separador de miles (es-CO usa punto). Sin decimales. */
export function formatoMonto(n: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)
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
