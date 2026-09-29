import { describe, expect, it } from 'vitest'
import { buildBreakdownModel, buildTaxRuleParams, sumLines } from './breakdownModel'
import { calculate } from './calculations'
import { formatNOK } from './formatting'
import { DEFAULT_INPUTS } from '../constants/defaults'
import type { Inputs, Mode } from '../types'

const cases: [string, Inputs, Mode][] = [
  ['quick defaults', DEFAULT_INPUTS, 'quick'],
  ['advanced defaults', DEFAULT_INPUTS, 'advanced'],
  ['advanced + shared debt + IO', { ...DEFAULT_INPUTS, sharedDebt: 500_000, interestOnlyYears: 3 }, 'advanced'],
  ['advanced + wealth tax', {
    ...DEFAULT_INPUTS, purchasePrice: 25_000_000, downPayment: 15_000_000, askBalance: 5_000_000, years: 20,
  }, 'advanced'],
]

describe('buildBreakdownModel', () => {
  it.each(cases)('buyer cost lines reconcile to the monthly total (%s)', (_n, inputs, mode) => {
    const model = buildBreakdownModel(calculate(inputs, mode), inputs, mode)
    expect(sumLines(model.buyerCostLines)).toBeCloseTo(model.buyerMonthlyTotal, 6)
  })

  it.each(cases)('buyer net-worth lines reconcile to the reported net worth (%s)', (_n, inputs, mode) => {
    const model = buildBreakdownModel(calculate(inputs, mode), inputs, mode)
    expect(sumLines(model.buyerNetWorthLines) / model.inflationFactor).toBeCloseTo(model.buyerNetWorth, 4)
  })

  it.each(cases)('renter net-worth lines reconcile to the reported net worth (%s)', (_n, inputs, mode) => {
    const model = buildBreakdownModel(calculate(inputs, mode), inputs, mode)
    expect(sumLines(model.renterNetWorthLines) / model.inflationFactor).toBeCloseTo(model.renterNetWorth, 4)
  })

  it('omits zero-valued optional cost lines', () => {
    const quick = buildBreakdownModel(calculate(DEFAULT_INPUTS, 'quick'), DEFAULT_INPUTS, 'quick')
    expect(quick.buyerCostLines.map(l => l.id)).toEqual(['mortgage', 'hoaFee', 'interestDeduction'])
  })

  it('shows portfolio, ASK-tax and shared-debt lines only when relevant', () => {
    const quick = buildBreakdownModel(calculate(DEFAULT_INPUTS, 'quick'), DEFAULT_INPUTS, 'quick')
    expect(quick.buyerNetWorthLines.map(l => l.id)).not.toContain('portfolioGross')

    const plain = buildBreakdownModel(calculate(DEFAULT_INPUTS, 'advanced'), DEFAULT_INPUTS, 'advanced')
    expect(plain.buyerNetWorthLines.map(l => l.id)).not.toContain('sharedDebt')
    expect(plain.buyerNetWorthLines.map(l => l.id)).toContain('portfolioGross')

    const [, rich, mode] = cases[3]
    const withDebt = buildBreakdownModel(calculate({ ...rich, sharedDebt: 100_000 }, mode), { ...rich, sharedDebt: 100_000 }, mode)
    expect(withDebt.buyerNetWorthLines.map(l => l.id)).toEqual(
      expect.arrayContaining(['sharedDebt', 'portfolioGross', 'askTax']),
    )
  })
})

describe('buildTaxRuleParams', () => {
  it('formats rates per locale', () => {
    const no = buildTaxRuleParams('nb-NO', v => formatNOK(v, false, 'nb-NO'))
    const en = buildTaxRuleParams('en-GB', v => formatNOK(v, false, 'en-GB'))
    expect(no.askTax).toBe('37,84')
    expect(en.askTax).toBe('37.84')
    expect(en.interestDeduction).toBe('22')
    expect(en.wealthTaxThreshold).toContain('1,900,000')
    expect(en.wealthTaxHighThreshold).toContain('21,500,000')
    expect(en.wealthTaxHighRate).toBe('1.1')
  })
})
