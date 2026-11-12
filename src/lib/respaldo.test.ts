import { describe, expect, it } from 'vitest'
import {
  nombreArchivoRespaldo,
  validarRespaldo,
  VERSION_RESPALDO,
} from './respaldo'

const base = () => ({
  version: VERSION_RESPALDO,
  exportadoEn: '2026-01-01T00:00:00.000Z',
  perfumes: [
    { id: 'p', nombre: 'A', mlIniciales: 100, precios: [{ ml: 5, precio: 1000 }], archivado: false, creadoEn: 'x' },
  ],
  clientes: [{ id: 'c', nombre: 'Ana', creadoEn: 'x' }],
  ventas: [
    {
      id: 'v',
      clienteId: 'c',
      fecha: 'x',
      items: [{ perfumeId: 'p', ml: 5, cantidad: 1, precioUnitario: 1000 }],
      total: 1000,
      anulada: false,
    },
  ],
  pagos: [{ id: 'g', clienteId: 'c', monto: 500, fecha: 'x', metodo: 'efectivo' }],
  ajustes: [{ id: 'a', perfumeId: 'p', ml: -5, motivo: 'm', fecha: 'x' }],
  config: [{ clave: 'umbralStockBajo', valor: 10 }],
})

describe('validarRespaldo', () => {
  it('acepta un respaldo válido', () => {
    expect(validarRespaldo(base()).ok).toBe(true)
  })
  it('rechaza lo que no es un objeto', () => {
    expect(validarRespaldo(null).ok).toBe(false)
    expect(validarRespaldo([]).ok).toBe(false)
    expect(validarRespaldo('hola').ok).toBe(false)
  })
  it('rechaza otra versión', () => {
    expect(validarRespaldo({ ...base(), version: 99 }).ok).toBe(false)
  })
  it('rechaza si falta una sección', () => {
    const { pagos, ...resto } = base()
    void pagos
    expect(validarRespaldo(resto).ok).toBe(false)
  })
  it('rechaza datos con tipos incorrectos', () => {
    const r = base()
    r.ventas[0].total = '1000' as unknown as number
    const res = validarRespaldo(r)
    expect(res.ok).toBe(false)
  })
  it('rechaza un método de pago desconocido', () => {
    const r = base()
    r.pagos[0].metodo = 'bitcoin'
    expect(validarRespaldo(r).ok).toBe(false)
  })
  it('rechaza referencias a clientes o perfumes inexistentes', () => {
    const a = base()
    a.ventas[0].clienteId = 'nadie'
    expect(validarRespaldo(a).ok).toBe(false)
    const b = base()
    b.ajustes[0].perfumeId = 'nada'
    expect(validarRespaldo(b).ok).toBe(false)
    const c = base()
    c.pagos[0].clienteId = 'nadie'
    expect(validarRespaldo(c).ok).toBe(false)
  })
})

describe('nombreArchivoRespaldo', () => {
  it('incluye la fecha', () => {
    expect(nombreArchivoRespaldo(new Date(2026, 2, 5))).toBe('decants-respaldo-2026-03-05.json')
  })
})
