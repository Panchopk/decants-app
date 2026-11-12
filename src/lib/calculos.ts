import type { AjusteStock, ItemVenta, Pago, Venta } from '../db/tipos'

export const UMBRAL_STOCK_BAJO_DEFECTO = 10

/** Total de una venta a partir de sus items. */
export function totalVenta(items: ItemVenta[]): number {
  return items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0)
}

/** Saldo > 0: debe. 0: al día. < 0: saldo a favor. */
export function saldoCliente(
  clienteId: string,
  ventas: Venta[],
  pagos: Pago[],
): number {
  const comprado = ventas
    .filter((v) => v.clienteId === clienteId && !v.anulada)
    .reduce((s, v) => s + v.total, 0)
  const pagado = pagos
    .filter((p) => p.clienteId === clienteId)
    .reduce((s, p) => s + p.monto, 0)
  return comprado - pagado
}

/** ml restantes = iniciales − vendidos (no anuladas) + ajustes. Redondeado a 1 decimal. */
export function mlRestantes(
  perfumeId: string,
  mlIniciales: number,
  ventas: Venta[],
  ajustes: AjusteStock[],
): number {
  const vendidos = ventas
    .filter((v) => !v.anulada)
    .flatMap((v) => v.items)
    .filter((i) => i.perfumeId === perfumeId)
    .reduce((s, i) => s + i.ml * i.cantidad, 0)
  const ajustado = ajustes
    .filter((a) => a.perfumeId === perfumeId)
    .reduce((s, a) => s + a.ml, 0)
  return Math.round((mlIniciales - vendidos + ajustado) * 10) / 10
}

export function tieneStockBajo(
  restantes: number,
  umbral: number = UMBRAL_STOCK_BAJO_DEFECTO,
): boolean {
  return restantes <= umbral
}

/** Suma de las deudas positivas de todos los clientes (los saldos a favor no restan). */
export function totalPorCobrar(
  clienteIds: string[],
  ventas: Venta[],
  pagos: Pago[],
): number {
  return clienteIds
    .map((id) => saldoCliente(id, ventas, pagos))
    .filter((s) => s > 0)
    .reduce((a, b) => a + b, 0)
}
