import { DEFAULT_INPUTS } from '../constants/defaults'
import type { Inputs, Mode } from '../types'

export const SCENARIO_STORAGE_KEY = 'leiexeie:scenario:v1'

export interface Scenario {
  mode: Mode
  inputs: Inputs
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function parseScenario(raw: unknown): Scenario | null {
  if (!raw || typeof raw !== 'object') return null
  const { mode, inputs } = raw as { mode?: unknown; inputs?: unknown }
  if (mode !== 'quick' && mode !== 'advanced') return null
  if (!inputs || typeof inputs !== 'object') return null

  const source = inputs as Record<string, unknown>
  const merged: Inputs = { ...DEFAULT_INPUTS }
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]) {
    const value = source[key]
    const expected = typeof DEFAULT_INPUTS[key]
    if (expected === 'number' && typeof value === 'number' && Number.isFinite(value)) {
      (merged as Record<keyof Inputs, number | boolean>)[key] = value
    } else if (expected === 'boolean' && typeof value === 'boolean') {
      (merged as Record<keyof Inputs, number | boolean>)[key] = value
    }
  }
  // Older scenarios predate the borettslag toggle; shared debt implies one.
  if (typeof source.isBorettslag !== 'boolean' && merged.sharedDebt > 0) merged.isBorettslag = true
  return { mode, inputs: merged }
}

export function loadScenario(storage: StorageLike | null = defaultStorage()): Scenario | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(SCENARIO_STORAGE_KEY)
    return raw ? parseScenario(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveScenario(scenario: Scenario, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenario))
  } catch {
    return
  }
}

export function clearScenario(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(SCENARIO_STORAGE_KEY)
  } catch {
    return
  }
}

export const SAVED_SCENARIOS_STORAGE_KEY = 'leiexeie:saved:v1'
export const MAX_SAVED_SCENARIOS = 6

export interface SavedScenario extends Scenario {
  id: string
  name: string
}

export function parseSavedScenarios(raw: unknown): SavedScenario[] {
  if (!Array.isArray(raw)) return []
  const out: SavedScenario[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const { id, name } = entry as { id?: unknown; name?: unknown }
    if (typeof id !== 'string' || typeof name !== 'string') continue
    const scenario = parseScenario(entry)
    if (scenario) out.push({ id, name, ...scenario })
  }
  return out.slice(0, MAX_SAVED_SCENARIOS)
}

export function loadSavedScenarios(storage: StorageLike | null = defaultStorage()): SavedScenario[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(SAVED_SCENARIOS_STORAGE_KEY)
    return raw ? parseSavedScenarios(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function storeSavedScenarios(list: SavedScenario[], storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(SAVED_SCENARIOS_STORAGE_KEY, JSON.stringify(list))
  } catch {
    return
  }
}
