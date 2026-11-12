import { formatoMonto } from '../lib/formato'

/** Saldo con color: rojo = debe, verde = a favor, gris = al día. */
export function EtiquetaSaldo({ saldo }: { saldo: number }) {
  if (saldo > 0) {
    return <span className="font-semibold text-debt">Debe {formatoMonto(saldo)}</span>
  }
  if (saldo < 0) {
    return <span className="font-semibold text-credit">A favor {formatoMonto(-saldo)}</span>
  }
  return <span className="text-muted">Al día</span>
}
