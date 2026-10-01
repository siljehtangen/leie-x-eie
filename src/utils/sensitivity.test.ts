import { describe, expect, it } from 'vitest'
import { buildSensitivityGrid } from './sensitivity'
import { calculate } from './calculations'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('buildSensitivityGrid', () => {
  it.each(['quick', 'advanced'] as const)('builds a 5×5 grid centred on the current inputs (%s)', mode => {
    const grid = buildSensitivityGrid(DEFAULT_INPUTS, mode)
    expect(grid.rows.map(r => r.appreciationRate)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5])
    expect(grid.mortgageRates).toEqual([3.5, 4.5, 5.5, 6.5, 7.5])

    const base = grid.rows[2].cells[2]
    const { yearlyData } = calculate(DEFAULT_INPUTS, mode)
    const last = yearlyData[yearlyData.length - 1]
    expect(base.buyAdvantage).toBeCloseTo(last.buyerNetWorth - last.renterNetWorth, 6)
  })

  it('favours buying more as prices grow faster and rates fall', () => {
    const { rows } = buildSensitivityGrid(DEFAULT_INPUTS, 'quick')
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].cells[2].buyAdvantage).toBeGreaterThan(rows[i - 1].cells[2].buyAdvantage)
    }
    const middle = rows[2].cells
    for (let j = 1; j < middle.length; j++) {
      expect(middle[j].buyAdvantage).toBeLessThan(middle[j - 1].buyAdvantage)
    }
  })

  it('drops mortgage rates that would be zero or negative', () => {
    const grid = buildSensitivityGrid({ ...DEFAULT_INPUTS, mortgageRate: 1.5 }, 'quick')
    expect(grid.mortgageRates).toEqual([0.5, 1.5, 2.5, 3.5])
  })
})
