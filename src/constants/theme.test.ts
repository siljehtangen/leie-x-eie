import { describe, expect, it } from 'vitest'
import { COLORS, DARK_COLORS, cssVarName, type ColorKey } from './theme'

const stylesheets = import.meta.glob<string>('../styles/*.css', { query: '?raw', import: 'default', eager: true })

describe('theme', () => {
  it('derives kebab-case CSS variable names', () => {
    expect(cssVarName('buy')).toBe('--color-buy')
    expect(cssVarName('textSecondary')).toBe('--color-text-secondary')
  })

  it('finds the stylesheets', () => {
    expect(Object.keys(stylesheets).length).toBeGreaterThan(0)
    expect(Object.values(stylesheets).every(css => css.length > 0)).toBe(true)
  })

  it('gives the dark palette the same keys as the light one', () => {
    expect(Object.keys(DARK_COLORS).sort()).toEqual(Object.keys(COLORS).sort())
  })

  it('defines every --color-* variable referenced in the stylesheets', () => {
    const defined = new Set((Object.keys(COLORS) as ColorKey[]).map(cssVarName))
    const css = Object.values(stylesheets).join('\n')
    const used = new Set([...css.matchAll(/var\((--color-[a-z-]+)/g)].map(m => m[1]))
    expect([...used].filter(v => !defined.has(v))).toEqual([])
  })

  it('keeps stylesheet colors in the theme (no raw hex values)', () => {
    for (const [file, css] of Object.entries(stylesheets)) {
      const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
      expect({ file, hex }).toEqual({ file, hex: [] })
    }
  })
})
