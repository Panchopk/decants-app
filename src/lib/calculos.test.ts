import { describe, expect, it } from 'vitest'
import type { AjusteStock, ItemVenta, Pago, Venta } from '../db/tipos'
import {
  mlRestantes,
  saldoCliente,
  tieneStockBajo,
  totalPorCobrar,
  totalVenta,
} from './calculos'

const venta = (
  id: string,
  clienteId: string,
  items: ItemVenta[],
  anulada = false,
): Venta => ({
  id,
  clienteId,
  fecha: '2026-01-01',
  items,
  total: totalVenta(items),
  anulada,
})
const pago = (clienteId: string, monto: number): Pago => ({
  id: crypto.randomUUID(),
  clienteId,
  monto,
  fecha: '2026-01-02',
})
const ajuste = (perfumeId: string, ml: number): AjusteStock => ({
  id: crypto.randomUUID(),
  perfumeId,
  ml,
  motivo: 'x',
  fecha: '2026-01-02',
})
const item = (perfumeId: string, ml: number, cantidad: number, precioUnitario: number) => ({
  perfumeId,
  ml,
  cantidad,
  precioUnitario,
})

describe('totalVenta', () => {
  it('multiplica precio por cantidad', () => {
    expect(totalVenta([item('p', 5, 2, 10000), item('p', 3, 1, 6000)])).toBe(26000)
  })
})

describe('saldoCliente', () => {
  const v = [venta('1', 'a', [item('p', 5, 2, 10000)])] // 20000

  it('sin pagos debe todo', () => {
    expect(saldoCliente('a', v, [])).toBe(20000)
  })
  it('pago parcial reduce la deuda', () => {
    expect(saldoCliente('a', v, [pago('a', 8000)])).toBe(12000)
  })
  it('pago completo deja al día', () => {
    expect(saldoCliente('a', v, [pago('a', 20000)])).toBe(0)
  })
  it('pago de más da saldo a favor (negativo)', () => {
    expect(saldoCliente('a', v, [pago('a', 25000)])).toBe(-5000)
  })
  it('ignora ventas anuladas', () => {
    const anulada = [venta('1', 'a', [item('p', 5, 2, 10000)], true)]
    expect(saldoCliente('a', anulada, [])).toBe(0)
  })
  it('ignora ventas y pagos de otros clientes', () => {
    expect(saldoCliente('b', v, [pago('a', 5000)])).toBe(0)
  })
  it('cantidad mayor a 1 multiplica el total', () => {
    const q = [venta('1', 'a', [item('p', 3, 4, 5000)])]
    expect(saldoCliente('a', q, [])).toBe(20000)
  })
})

describe('mlRestantes', () => {
  it('sin movimientos devuelve los iniciales', () => {
    expect(mlRestantes('p', 100, [], [])).toBe(100)
  })
  it('descuenta ml × cantidad', () => {
    const v = [venta('1', 'a', [item('p', 5, 2, 1)])]
    expect(mlRestantes('p', 100, v, [])).toBe(90)
  })
  it('ignora ventas anuladas', () => {
    const v = [venta('1', 'a', [item('p', 5, 2, 1)], true)]
    expect(mlRestantes('p', 100, v, [])).toBe(100)
  })
  it('ignora ventas de otros perfumes', () => {
    const v = [venta('1', 'a', [item('q', 5, 2, 1)])]
    expect(mlRestantes('p', 100, v, [])).toBe(100)
  })
  it('ajuste negativo resta (merma)', () => {
    expect(mlRestantes('p', 100, [], [ajuste('p', -5)])).toBe(95)
  })
  it('ajuste positivo suma (corrección)', () => {
    const v = [venta('1', 'a', [item('p', 10, 1, 1)])]
    expect(mlRestantes('p', 100, v, [ajuste('p', 2)])).toBe(92)
  })
  it('ignora ajustes de otros perfumes', () => {
    expect(mlRestantes('p', 100, [], [ajuste('q', -50)])).toBe(100)
  })
  it('puede quedar negativo al vender de más', () => {
    const v = [venta('1', 'a', [item('p', 10, 3, 1)])]
    expect(mlRestantes('p', 20, v, [])).toBe(-10)
  })
  it('maneja decimales sin errores de punto flotante', () => {
    const v = [venta('1', 'a', [item('p', 0.1, 3, 1)])]
    expect(mlRestantes('p', 1, v, [])).toBe(0.7)
  })
})

describe('tieneStockBajo', () => {
  it('usa el umbral por defecto de 10 ml', () => {
    expect(tieneStockBajo(10)).toBe(true)
    expect(tieneStockBajo(10.1)).toBe(false)
  })
  it('acepta umbral personalizado', () => {
    expect(tieneStockBajo(25, 30)).toBe(true)
    expect(tieneStockBajo(31, 30)).toBe(false)
  })
})

describe('totalPorCobrar', () => {
  it('suma solo deudas, sin restar saldos a favor', () => {
    const v = [
      venta('1', 'a', [item('p', 5, 1, 10000)]),
      venta('2', 'b', [item('p', 5, 1, 4000)]),
      venta('3', 'c', [item('p', 5, 1, 3000)]),
    ]
    const p = [pago('b', 4000), pago('c', 9000)] // a debe 10000, b 0, c a favor 6000
    expect(totalPorCobrar(['a', 'b', 'c'], v, p)).toBe(10000)
  })
})
