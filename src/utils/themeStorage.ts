import type { Theme } from '../constants/theme'

export const THEME_STORAGE_KEY = 'leiexeie:theme:v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadStoredTheme(storage: StorageLike | null = defaultStorage()): Theme | null {
  try {
    const raw = storage?.getItem(THEME_STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    return
  }
}

export function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function initialTheme(storage?: StorageLike | null): Theme {
  return loadStoredTheme(storage) ?? systemTheme()
}
