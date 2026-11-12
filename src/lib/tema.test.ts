import { describe, expect, it } from 'vitest'
import { resolverTema } from './tema'

describe('resolverTema', () => {
  it('auto sigue la preferencia del celular', () => {
    expect(resolverTema('auto', true)).toBe('oscuro')
    expect(resolverTema('auto', false)).toBe('claro')
  })
  it('claro y oscuro ignoran la preferencia del celular', () => {
    expect(resolverTema('claro', true)).toBe('claro')
    expect(resolverTema('oscuro', false)).toBe('oscuro')
  })
})
