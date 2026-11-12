import { describe, expect, it } from 'vitest'
import { enlaceWhatsApp } from './whatsapp'

describe('enlaceWhatsApp', () => {
  it('limpia el teléfono y codifica el mensaje', () => {
    const url = enlaceWhatsApp('+57 300 123 4567', 'Laura', 12000)!
    expect(url.startsWith('https://wa.me/573001234567?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Laura')
    expect(decodeURIComponent(url.split('text=')[1])).toContain('12')
  })
  it('devuelve null sin teléfono válido', () => {
    expect(enlaceWhatsApp(undefined, 'A', 1)).toBeNull()
    expect(enlaceWhatsApp('abc', 'A', 1)).toBeNull()
  })
})
