import { describe, expect, it } from 'vitest'
import { buildShareUrl, decodeScenario, encodeScenario } from './shareUrl'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('shareUrl', () => {
  it('round-trips a scenario', () => {
    const scenario = {
      mode: 'advanced' as const,
      inputs: { ...DEFAULT_INPUTS, monthlyRent: 15_500, mortgageRate: 4.85, bsuActive: true },
    }
    expect(decodeScenario(encodeScenario(scenario))).toEqual(scenario)
  })

  it('only encodes values that differ from the defaults', () => {
    const query = encodeScenario({ mode: 'quick', inputs: { ...DEFAULT_INPUTS, years: 15 } })
    expect(query).toBe('mode=quick&years=15')
  })

  it('returns null without a mode', () => {
    expect(decodeScenario('')).toBeNull()
    expect(decodeScenario('?monthlyRent=9000')).toBeNull()
    expect(decodeScenario('?mode=turbo')).toBeNull()
  })

  it('ignores malformed values and unknown keys', () => {
    const decoded = decodeScenario('?mode=quick&monthlyRent=abc&years=&bsuActive=yes&hacker=1&purchasePrice=3000000')
    expect(decoded).toEqual({ mode: 'quick', inputs: { ...DEFAULT_INPUTS, purchasePrice: 3_000_000 } })
  })

  it('builds an absolute link', () => {
    const url = buildShareUrl(
      { mode: 'quick', inputs: { ...DEFAULT_INPUTS, years: 20 } },
      { origin: 'https://leiexeie.no', pathname: '/' },
    )
    expect(url).toBe('https://leiexeie.no/?mode=quick&years=20')
  })
})
