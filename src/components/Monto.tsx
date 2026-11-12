import { formatoMonto } from '../lib/formato'

/** Saldo con color: rojo = debe, verde = a favor, gris = al día. */
export function EtiquetaSaldo({ saldo }: { saldo: number }) {
  if (saldo > 0) {
    return <span className="font-semibold text-red-600">Debe {formatoMonto(saldo)}</span>
  }
  if (saldo < 0) {
    return <span className="font-semibold text-green-600">A favor {formatoMonto(-saldo)}</span>
  }
  return <span className="text-slate-500">Al día</span>
}
