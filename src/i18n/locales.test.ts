import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import no from './locales/no.json'

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out[path] = value
    else Object.assign(out, flatten(value, path))
  }
  return out
}

const placeholders = (s: string) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]).sort()

describe('locales', () => {
  const flatEn = flatten(en as Tree)
  const flatNo = flatten(no as Tree)

  it('have identical keys', () => {
    expect(Object.keys(flatNo).sort()).toEqual(Object.keys(flatEn).sort())
  })

  it('use the same interpolation placeholders per key', () => {
    for (const key of Object.keys(flatEn)) {
      expect({ key, vars: placeholders(flatNo[key] ?? '') }).toEqual({ key, vars: placeholders(flatEn[key]) })
    }
  })

  it('have no empty strings', () => {
    for (const [key, value] of [...Object.entries(flatEn), ...Object.entries(flatNo)]) {
      expect({ key, empty: value.trim() === '' }).toEqual({ key, empty: false })
    }
  })
})
