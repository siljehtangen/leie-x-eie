import { describe, expect, it } from 'vitest'
import { applyInputChange, applyPreset, matchesPreset } from './inputUpdates'
import { CITY_PRESETS } from '../constants/presets'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('applyInputChange', () => {
  it('keeps stamp duty and down payment in sync with price while they track the defaults', () => {
    const next = applyInputChange(DEFAULT_INPUTS, 'purchasePrice', 5_000_000)
    expect(next.stampDuty).toBe(125_000)
    expect(next.downPayment).toBe(750_000)
  })

  it('leaves user-customised stamp duty and down payment alone', () => {
    const custom = { ...DEFAULT_INPUTS, stampDuty: 0, downPayment: 1_000_000 }
    const next = applyInputChange(custom, 'purchasePrice', 5_000_000)
    expect(next.stampDuty).toBe(0)
    expect(next.downPayment).toBe(1_000_000)
  })

  it('updates other fields without side effects', () => {
    const next = applyInputChange(DEFAULT_INPUTS, 'bsuActive', true)
    expect(next).toEqual({ ...DEFAULT_INPUTS, bsuActive: true })
  })
})

describe('applyPreset', () => {
  const oslo = CITY_PRESETS.find(p => p.id === 'oslo')!.values

  it('sets price, rent and HOA and keeps derived costs in sync', () => {
    const next = applyPreset(DEFAULT_INPUTS, oslo)
    expect(next).toMatchObject({ ...oslo, stampDuty: 137_500, downPayment: 825_000 })
    expect(matchesPreset(next, oslo)).toBe(true)
    expect(matchesPreset(DEFAULT_INPUTS, oslo)).toBe(false)
  })

  it('leaves unrelated inputs untouched', () => {
    const next = applyPreset({ ...DEFAULT_INPUTS, years: 20 }, oslo)
    expect(next.years).toBe(20)
    expect(next.mortgageRate).toBe(DEFAULT_INPUTS.mortgageRate)
  })
})
