import { describe, expect, it } from 'vitest'
import { toChartUnits } from './chartUnits'
import type { YearlyDataPoint } from '../types'

const point = (year: number): YearlyDataPoint => ({
  year,
  buyerMonthlyCost: 20_000,
  renterMonthlyCost: 15_000,
  buyerNetWorth: 1_000_000,
  renterNetWorth: 800_000,
  homeValue: 5_000_000,
  remainingMortgage: 3_000_000,
  remainingSharedDebt: 0,
  buyerPortfolio: 100_000,
})

describe('toChartUnits', () => {
  it("keeps year-1 costs at today's prices and deflates stocks to end of year", () => {
    const [y1, y2] = toChartUnits([point(1), point(2)], 10, 'real')
    expect(y1.buyerMonthlyCost).toBe(20_000)
    expect(y1.homeValue).toBeCloseTo(5_000_000 / 1.1)
    expect(y2.renterMonthlyCost).toBeCloseTo(15_000 / 1.1)
    expect(y1.buyerNetWorth).toBe(1_000_000)
    expect(y1.netWorthGap).toBe(200_000)
  })

  it('inflates real net worth back to nominal and leaves nominal series unchanged', () => {
    const [, y2] = toChartUnits([point(1), point(2)], 10, 'nominal')
    expect(y2.buyerNetWorth).toBeCloseTo(1_000_000 * 1.21)
    expect(y2.renterNetWorth).toBeCloseTo(800_000 * 1.21)
    expect(y2.netWorthGap).toBeCloseTo(200_000 * 1.21)
    expect(y2.homeValue).toBe(5_000_000)
    expect(y2.buyerMonthlyCost).toBe(20_000)
  })

  it('is a no-op on values when inflation is zero', () => {
    const [real] = toChartUnits([point(3)], 0, 'real')
    const [nominal] = toChartUnits([point(3)], 0, 'nominal')
    expect(real).toEqual(nominal)
  })
})
