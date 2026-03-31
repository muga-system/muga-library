import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toBe('foo bar')
  })

  it('should handle objects', () => {
    const result = cn({ foo: true, bar: false })
    expect(result).toBe('foo')
  })

  it('should handle mixed inputs', () => {
    const result = cn('foo', { bar: true, baz: false }, 'qux')
    expect(result).toBe('foo bar qux')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle tailwind merge conflicts', () => {
    const result = cn('px-2 px-4')
    expect(result).toBe('px-4')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false
    const result = cn('base-class', isActive && 'active', isDisabled && 'disabled')
    expect(result).toBe('base-class active')
  })
})
