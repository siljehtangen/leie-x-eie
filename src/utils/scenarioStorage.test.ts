import { describe, expect, it } from 'vitest'
import {
  clearScenario, loadSavedScenarios, loadScenario, MAX_SAVED_SCENARIOS, parseSavedScenarios, parseScenario,
  saveScenario, SAVED_SCENARIOS_STORAGE_KEY, SCENARIO_STORAGE_KEY, storeSavedScenarios,
} from './scenarioStorage'
import { DEFAULT_INPUTS } from '../constants/defaults'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v) },
    removeItem: (k: string) => { data.delete(k) },
  }
}

describe('scenarioStorage', () => {
  it('round-trips a scenario', () => {
    const storage = memoryStorage()
    const scenario = { mode: 'advanced' as const, inputs: { ...DEFAULT_INPUTS, monthlyRent: 15_000, bsuActive: true } }
    saveScenario(scenario, storage)
    expect(loadScenario(storage)).toEqual(scenario)
    clearScenario(storage)
    expect(loadScenario(storage)).toBeNull()
  })

  it('rejects unknown modes and non-objects', () => {
    expect(parseScenario(null)).toBeNull()
    expect(parseScenario({ mode: 'turbo', inputs: {} })).toBeNull()
    expect(parseScenario({ mode: 'quick' })).toBeNull()
  })

  it('drops wrongly typed or unknown fields and fills in defaults', () => {
    const parsed = parseScenario({
      mode: 'quick',
      inputs: { monthlyRent: '9000', purchasePrice: 3_000_000, bsuActive: 'yes', hacker: 1, years: Infinity },
    })
    expect(parsed?.inputs).toEqual({ ...DEFAULT_INPUTS, purchasePrice: 3_000_000 })
  })

  it('ignores corrupt JSON', () => {
    expect(loadScenario(memoryStorage({ [SCENARIO_STORAGE_KEY]: '{not json' }))).toBeNull()
  })

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    }
    expect(loadScenario(broken)).toBeNull()
    expect(() => saveScenario({ mode: 'quick', inputs: DEFAULT_INPUTS }, broken)).not.toThrow()
    expect(() => clearScenario(broken)).not.toThrow()
  })
})

describe('saved scenarios', () => {
  it('round-trips a list', () => {
    const storage = memoryStorage()
    const list = [
      { id: 'a', name: 'Oslo', mode: 'quick' as const, inputs: { ...DEFAULT_INPUTS, purchasePrice: 5_500_000 } },
      { id: 'b', name: 'Bergen', mode: 'advanced' as const, inputs: DEFAULT_INPUTS },
    ]
    storeSavedScenarios(list, storage)
    expect(loadSavedScenarios(storage)).toEqual(list)
  })

  it('drops invalid entries and caps the list length', () => {
    const valid = { id: 'x', name: 'X', mode: 'quick', inputs: {} }
    const raw = [null, { name: 'no id', mode: 'quick', inputs: {} }, { id: 'y', name: 'Y', mode: 'turbo', inputs: {} },
      ...Array.from({ length: MAX_SAVED_SCENARIOS + 2 }, () => valid)]
    const parsed = parseSavedScenarios(raw)
    expect(parsed).toHaveLength(MAX_SAVED_SCENARIOS)
    expect(parsed[0]).toEqual({ id: 'x', name: 'X', mode: 'quick', inputs: DEFAULT_INPUTS })
  })

  it('returns an empty list for corrupt or missing data', () => {
    expect(loadSavedScenarios(memoryStorage())).toEqual([])
    expect(loadSavedScenarios(memoryStorage({ [SAVED_SCENARIOS_STORAGE_KEY]: '{oops' }))).toEqual([])
    expect(parseSavedScenarios({ not: 'an array' })).toEqual([])
  })
})
