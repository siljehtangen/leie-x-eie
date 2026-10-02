import { describe, expect, it } from 'vitest'
import { buyAdvantage, computeBreakevenThresholds, solveBreakeven } from './breakeven'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('solveBreakeven', () => {
  it.each(['quick', 'advanced'] as const)('finds the rent and price growth where both paths are equal (%s)', mode => {
    const { monthlyRent, appreciationRate } = computeBreakevenThresholds(DEFAULT_INPUTS, mode)
    expect(monthlyRent).not.toBeNull()
    expect(appreciationRate).not.toBeNull()
    expect(buyAdvantage({ ...DEFAULT_INPUTS, monthlyRent: monthlyRent! }, mode)).toBeCloseTo(0, -1)
    expect(buyAdvantage({ ...DEFAULT_INPUTS, appreciationRate: appreciationRate! }, mode)).toBeCloseTo(0, -1)
  })

  it('agrees with the current recommendation', () => {
    const rent = solveBreakeven(DEFAULT_INPUTS, 'quick', 'monthlyRent')!
    const winsNow = buyAdvantage(DEFAULT_INPUTS, 'quick') >= 0
    expect(DEFAULT_INPUTS.monthlyRent >= rent).toBe(winsNow)
  })

  it('returns null when buying wins across the whole search range', () => {
    const cheap = {
      ...DEFAULT_INPUTS,
      purchasePrice: 100_000, downPayment: 100_000, stampDuty: 0, monthlyHoaFee: 0, brokerSellingFee: 0,
      appreciationRate: 10,
    }
    expect(solveBreakeven(cheap, 'quick', 'monthlyRent')).toBeNull()
  })
})
