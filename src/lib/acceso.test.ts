import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { accesoRequerido, crearHash, esperaTrasFallos, huella, verificarClave } from './acceso'

describe('hash de la clave', () => {
  it('acepta la clave correcta y rechaza otra', async () => {
    const hash = await crearHash('una clave larga 2026', 1000)
    expect(await verificarClave('una clave larga 2026', hash)).toBe(true)
    expect(await verificarClave('otra clave distinta', hash)).toBe(false)
    expect(await verificarClave('', hash)).toBe(false)
  })

  it('no repite el hash para la misma clave (sal aleatoria)', async () => {
    const a = await crearHash('misma clave', 1000)
    const b = await crearHash('misma clave', 1000)
    expect(a).not.toBe(b)
  })

  it('es compatible con el hash que genera el script de Node', async () => {
    const sal = randomBytes(16)
    const hash = pbkdf2Sync('clave desde el script', sal, 1000, 32, 'sha256')
    const texto = `pbkdf2-sha256$1000$${sal.toString('base64')}$${hash.toString('base64')}`
    expect(await verificarClave('clave desde el script', texto)).toBe(true)
    expect(await verificarClave('clave equivocada', texto)).toBe(false)
  })

  it('rechaza hashes mal formados sin fallar', async () => {
    expect(await verificarClave('x', '')).toBe(false)
    expect(await verificarClave('x', 'basura')).toBe(false)
    expect(await verificarClave('x', 'md5$1$aa$bb')).toBe(false)
    expect(await verificarClave('x', 'pbkdf2-sha256$0$aa$bb')).toBe(false)
    expect(await verificarClave('x', 'pbkdf2-sha256$1000$%%%$%%%')).toBe(false)
  })
})

describe('configuración', () => {
  it('sin hash no se pide clave', () => {
    expect(accesoRequerido('')).toBe(false)
    expect(accesoRequerido('pbkdf2-sha256$1$a$b')).toBe(true)
  })
  it('la huella cambia si cambia la clave', async () => {
    const a = await crearHash('clave uno uno uno', 1000)
    const b = await crearHash('clave dos dos dos', 1000)
    expect(huella(a)).not.toBe(huella(b))
    expect(huella(a)).toHaveLength(16)
  })
})

describe('espera tras fallos', () => {
  it('hasta 4 fallos no espera; luego crece y se detiene en 10 minutos', () => {
    expect([0, 1, 4].map(esperaTrasFallos)).toEqual([0, 0, 0])
    expect(esperaTrasFallos(5)).toBe(30)
    expect(esperaTrasFallos(6)).toBe(60)
    expect(esperaTrasFallos(7)).toBe(120)
    expect(esperaTrasFallos(30)).toBe(600)
  })
})
