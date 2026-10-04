import { describe, expect, it } from 'vitest'
import { buildSensitivityGrid } from './sensitivity'
import { calculate } from './calculations'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('buildSensitivityGrid', () => {
  it.each(['quick', 'advanced'] as const)('builds a 5×5 grid centred on the current inputs (%s)', mode => {
    const grid = buildSensitivityGrid(DEFAULT_INPUTS, mode)
    expect(grid.rows.map(r => r.value)).toEqual([0.5, 1.5, 2.5, 3.5, 4.5])
    expect(grid.colValues).toEqual([3.5, 4.5, 5.5, 6.5, 7.5])

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
    expect(grid.colValues).toEqual([0.5, 1.5, 2.5, 3.5])
  })

  it('varies the savings-account return in quick mode and the ASK return in advanced mode', () => {
    const quick = buildSensitivityGrid(DEFAULT_INPUTS, 'quick', 'returnRate', 'rentIncrease')
    expect(quick.baseRow).toBe(DEFAULT_INPUTS.investmentReturn)
    const advanced = buildSensitivityGrid(DEFAULT_INPUTS, 'advanced', 'returnRate', 'rentIncrease')
    expect(advanced.baseRow).toBe(DEFAULT_INPUTS.askRate)

    for (const grid of [quick, advanced]) {
      const column = grid.rows.map(r => r.cells[1].buyAdvantage)
      for (let i = 1; i < column.length; i++) expect(column[i]).toBeLessThan(column[i - 1])
      const row = grid.rows[2].cells.map(c => c.buyAdvantage)
      for (let j = 1; j < row.length; j++) expect(row[j]).toBeGreaterThan(row[j - 1])
    }
  })

  it('stops non-price axes at zero but lets house prices fall', () => {
    const grid = buildSensitivityGrid(
      { ...DEFAULT_INPUTS, appreciationRate: 0.5, rentIncrease: 1 },
      'quick',
      'appreciationRate',
      'rentIncrease',
    )
    expect(grid.rows.map(r => r.value)).toEqual([-1.5, -0.5, 0.5, 1.5, 2.5])
    expect(grid.colValues).toEqual([0, 1, 2, 3])
  })
})
