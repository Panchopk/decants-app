import { describe, expect, it } from 'vitest'
import { claveDia, etiquetaDia, formatoMonto } from './formato'

describe('etiquetaDia', () => {
  const ahora = new Date(2026, 10, 11, 15, 0)
  it('hoy y ayer', () => {
    expect(etiquetaDia(new Date(2026, 10, 11, 8, 0).toISOString(), ahora)).toBe('Hoy')
    expect(etiquetaDia(new Date(2026, 10, 10, 23, 0).toISOString(), ahora)).toBe('Ayer')
  })
  it('otro día muestra la fecha', () => {
    expect(etiquetaDia(new Date(2026, 9, 1, 12, 0).toISOString(), ahora)).not.toMatch(/Hoy|Ayer/)
  })
  it('agrupa por día local', () => {
    expect(claveDia(new Date(2026, 0, 5, 1, 0).toISOString())).toBe('2026-01-05')
  })
})

describe('formatoMonto', () => {
  it('usa separador de miles', () => {
    expect(formatoMonto(20000)).toMatch(/20.000/)
  })
})
