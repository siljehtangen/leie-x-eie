import { describe, expect, it } from 'vitest'
import { clearScenario, loadScenario, parseScenario, saveScenario, SCENARIO_STORAGE_KEY } from './scenarioStorage'
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
