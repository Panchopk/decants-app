import { formatoMonto } from '../lib/formato'

const pastilla = 'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold'

/** Estado de cuenta con texto y color (el color nunca va solo): Debe / A favor / Al día. */
export function EtiquetaSaldo({ saldo }: { saldo: number }) {
  if (saldo > 0) {
    return <span className={`${pastilla} bg-debt-soft text-debt-ink`}>Debe {formatoMonto(saldo)}</span>
  }
  if (saldo < 0) {
    return <span className={`${pastilla} bg-credit-soft text-credit-ink`}>A favor {formatoMonto(-saldo)}</span>
  }
  return <span className={`${pastilla} bg-sunken text-muted`}>Al día</span>
}
