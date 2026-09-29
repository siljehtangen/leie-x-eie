import { describe, expect, it } from 'vitest'
import { calculate, computeAnnualWealthTax, findBreakevenYear, normalizeInputs } from './calculations'
import { DEFAULT_INPUTS } from '../constants/defaults'
import {
  BSU_TAX_DEDUCTION_RATE,
  INTEREST_DEDUCTION,
  SECURITY_DEPOSIT_MONTHS,
} from '../constants/finance'
import type { CalculationResult, Inputs, Mode, YearlyDataPoint } from '../types'

const with_ = (overrides: Partial<Inputs>): Inputs => ({ ...DEFAULT_INPUTS, ...overrides })

function golden(result: CalculationResult) {
  const r = (n: number) => Math.round(n)
  const { summary } = result
  return {
    recommendation: result.recommendation,
    difference: r(result.difference),
    breakevenYear: result.breakevenYear,
    monthlyMortgagePayment: r(summary.monthlyMortgagePayment),
    initialBuyerMonthly: r(summary.initialBuyerMonthly),
    totalBuyerPaid: r(summary.totalBuyerPaid),
    totalRenterPaid: r(summary.totalRenterPaid),
    finalEquity: r(summary.finalEquity),
    finalRenterPortfolio: r(summary.finalRenterPortfolio),
    finalAskTax: r(summary.finalAskTax),
    finalRemainingMortgage: r(summary.finalRemainingMortgage),
    netWorthByYear: result.yearlyData.map(y => [y.year, r(y.buyerNetWorth), r(y.renterNetWorth)]),
  }
}

describe('calculate — golden scenarios', () => {
  const scenarios: [string, Inputs, Mode][] = [
    ['quick defaults', DEFAULT_INPUTS, 'quick'],
    ['advanced defaults', DEFAULT_INPUTS, 'advanced'],
    ['advanced with interest-only, shared debt and BSU', with_({
      interestOnlyYears: 3, sharedDebt: 500_000, bsuActive: true, years: 15,
    }), 'advanced'],
    ['expensive home triggering wealth tax', with_({
      purchasePrice: 25_000_000, downPayment: 15_000_000, stampDuty: 625_000,
      savingsAccountBalance: 3_000_000, askBalance: 5_000_000, years: 20,
    }), 'advanced'],
  ]

  it.each(scenarios)('%s', (_name, inputs, mode) => {
    expect(golden(calculate(inputs, mode))).toMatchSnapshot()
  })
})

describe('calculate — mortgage', () => {
  it('uses the standard annuity formula for the monthly payment', () => {
    const inputs = with_({ purchasePrice: 4_000_000, downPayment: 600_000, mortgageRate: 5.5, loanTermYears: 25 })
    const L = 3_400_000
    const r = 0.055 / 12
    const n = 300
    const expected = (L * r) / (1 - Math.pow(1 + r, -n))
    expect(calculate(inputs, 'quick').summary.monthlyMortgagePayment).toBeCloseTo(expected, 6)
  })

  it('amortises linearly at 0% interest', () => {
    const inputs = with_({ mortgageRate: 0, loanTermYears: 25, years: 10 })
    const { summary } = calculate(inputs, 'quick')
    expect(summary.monthlyMortgagePayment).toBeCloseTo(summary.loanAmount / 300, 6)
    expect(summary.finalRemainingMortgage).toBeCloseTo(summary.loanAmount * (15 / 25), 4)
  })

  it('never overpays the loan: payments stop once it is repaid', () => {
    const inputs = with_({ mortgageRate: 0, loanTermYears: 5, years: 8, monthlyHoaFee: 0 })
    const { summary, yearlyData } = calculate(inputs, 'quick')
    expect(summary.finalRemainingMortgage).toBe(0)
    const totalMortgagePaid = yearlyData.slice(0, 5).reduce((acc, y) => acc + y.buyerMonthlyCost * 12, 0)
    expect(totalMortgagePaid).toBeCloseTo(summary.loanAmount, 4)
    expect(yearlyData[6].buyerMonthlyCost).toBe(0)
  })

  it('repays the full loan with interest by the end of the term', () => {
    const { summary } = calculate(with_({ loanTermYears: 10, years: 10 }), 'quick')
    expect(summary.finalRemainingMortgage).toBeLessThan(1e-6)
  })

  it('keeps principal flat during interest-only years, then amortises over the remaining term', () => {
    const inputs = with_({ interestOnlyYears: 3, loanTermYears: 25, years: 10 })
    const { summary, yearlyData } = calculate(inputs, 'advanced')
    expect(summary.ioYears).toBe(3)
    expect(summary.remainingTermMonths).toBe(22 * 12)
    expect(summary.monthlyMortgagePayment).toBeCloseTo(summary.loanAmount * summary.monthlyRate, 6)
    for (const y of yearlyData.slice(0, 3)) expect(y.remainingMortgage).toBeCloseTo(summary.loanAmount, 6)
    expect(yearlyData[3].remainingMortgage).toBeLessThan(summary.loanAmount)
    expect(summary.monthlyAmortizingPayment).toBeGreaterThan(calculate(with_({ loanTermYears: 25 }), 'advanced').summary.monthlyAmortizingPayment)
  })

  it('caps interest-only years at loan term − 1 and ignores them in quick mode', () => {
    expect(calculate(with_({ interestOnlyYears: 10, loanTermYears: 5 }), 'advanced').summary.ioYears).toBe(4)
    expect(calculate(with_({ interestOnlyYears: 3 }), 'quick').summary.ioYears).toBe(0)
  })

  it('has no loan when the down payment covers the price', () => {
    const { summary } = calculate(with_({ downPayment: 5_000_000 }), 'quick')
    expect(summary.loanAmount).toBe(0)
    expect(summary.monthlyMortgagePayment).toBe(0)
  })
})

describe('calculate — year-1 cost breakdown', () => {
  const cases: [string, Inputs, Mode][] = [
    ['quick', DEFAULT_INPUTS, 'quick'],
    ['advanced', DEFAULT_INPUTS, 'advanced'],
    ['advanced + shared debt + IO + BSU', with_({ sharedDebt: 400_000, interestOnlyYears: 2, bsuActive: true, propertyTax: 3000 }), 'advanced'],
  ]

  it.each(cases)('components sum to the year-1 average monthly cost (%s)', (_n, inputs, mode) => {
    const { summary, yearlyData } = calculate(inputs, mode)
    const b = summary.year1BuyerCosts
    const buyerSum = b.mortgage + b.hoaFee + b.utilities + b.maintenance + b.municipalFees
      + b.insurance + b.propertyTax - b.interestDeduction
    expect(buyerSum).toBeCloseTo(yearlyData[0].buyerMonthlyCost, 6)
    expect(b.total).toBeCloseTo(yearlyData[0].buyerMonthlyCost, 6)

    const rc = summary.year1RenterCosts
    expect(rc.rent + rc.extras - rc.bsuDeduction).toBeCloseTo(yearlyData[0].renterMonthlyCost, 6)
  })

  it('deducts 22% of mortgage and shared-debt interest', () => {
    const inputs = with_({ interestOnlyYears: 2, sharedDebt: 600_000, sharedDebtRate: 5 })
    const { summary } = calculate(inputs, 'advanced')
    const expected = (summary.loanAmount * summary.monthlyRate + 600_000 * 0.05 / 12) * INTEREST_DEDUCTION
    expect(summary.year1BuyerCosts.interestDeduction).toBeCloseTo(expected, 6)
  })

  it('ignores advanced-only inputs in quick mode', () => {
    const base = calculate(DEFAULT_INPUTS, 'quick')
    const tweaked = calculate(with_({ electricity: 99_999, sharedDebt: 1_000_000, homeInsurance: 50_000 }), 'quick')
    expect(tweaked.summary.finalRenterPortfolio).toBeCloseTo(base.summary.finalRenterPortfolio, 6)
    expect(tweaked.summary.initialBuyerMonthly).toBeCloseTo(base.summary.initialBuyerMonthly, 6)
  })

  it('reduces renter cost by the BSU tax deduction', () => {
    const off = calculate(with_({ bsuActive: false }), 'advanced')
    const on = calculate(with_({ bsuActive: true, bsuYearlyContribution: 27_500 }), 'advanced')
    const expected = 27_500 * BSU_TAX_DEDUCTION_RATE / 12
    expect(off.yearlyData[0].renterMonthlyCost - on.yearlyData[0].renterMonthlyCost).toBeCloseTo(expected, 6)
  })
})

describe('calculate — net worth, recommendation and breakeven', () => {
  it('values every year as an exit at that point (broker fee and deposit included each year)', () => {
    const inputs = with_({ sharedDebt: 300_000, years: 12 })
    const { yearlyData } = calculate(inputs, 'advanced')
    for (const y of yearlyData) {
      const infl = Math.pow(1 + inputs.inflation / 100, y.year)
      const expected = (y.homeValue - y.remainingMortgage - inputs.sharedDebt - inputs.brokerSellingFee
        - y.cumulativeBuyerWealthTax) / infl
      expect(y.buyerNetWorth).toBeCloseTo(expected, 4)
    }
  })

  it.each(['quick', 'advanced'] as const)('gives the same year-N values regardless of horizon (%s)', mode => {
    const short = calculate(with_({ years: 5 }), mode).yearlyData
    const long = calculate(with_({ years: 15 }), mode).yearlyData
    short.forEach((y, i) => {
      expect(long[i].buyerNetWorth).toBeCloseTo(y.buyerNetWorth, 6)
      expect(long[i].renterNetWorth).toBeCloseTo(y.renterNetWorth, 6)
    })
  })

  it('holds back a security deposit in advanced mode and returns it on exit', () => {
    const { summary } = calculate(with_({ monthlyRent: 12_000, years: 1 }), 'advanced')
    expect(summary.securityDeposit).toBe(12_000 * SECURITY_DEPOSIT_MONTHS)
    expect(calculate(DEFAULT_INPUTS, 'quick').summary.securityDeposit).toBe(0)
  })

  it('recommends the path with the higher final real net worth', () => {
    for (const mode of ['quick', 'advanced'] as const) {
      for (const appreciationRate of [0, 2.5, 6]) {
        const res = calculate(with_({ appreciationRate }), mode)
        const last = res.yearlyData[res.yearlyData.length - 1]
        expect(res.recommendation).toBe(last.buyerNetWorth >= last.renterNetWorth ? 'buy' : 'rent')
        expect(res.difference).toBeCloseTo(Math.abs(last.buyerNetWorth - last.renterNetWorth), 6)
        expect(res.summary.finalEquity).toBe(last.buyerNetWorth)
        expect(res.summary.finalRenterPortfolio).toBe(last.renterNetWorth)
      }
    }
  })

  it('favours buying when home prices grow fast and renting when they fall', () => {
    expect(calculate(with_({ appreciationRate: 8, years: 20 }), 'quick').recommendation).toBe('buy')
    expect(calculate(with_({ appreciationRate: -3, years: 20 }), 'quick').recommendation).toBe('rent')
  })

  it('has an inflation factor of 1 when inflation is 0', () => {
    const { summary, yearlyData } = calculate(with_({ inflation: 0 }), 'quick')
    expect(summary.finalInflationFactor).toBe(1)
    const last = yearlyData[yearlyData.length - 1]
    expect(last.buyerNetWorth).toBeCloseTo(last.homeValue - last.remainingMortgage - DEFAULT_INPUTS.brokerSellingFee, 4)
  })
})

describe('findBreakevenYear', () => {
  const point = (year: number, buyer: number, renter: number): YearlyDataPoint => ({
    year, buyerNetWorth: buyer, renterNetWorth: renter,
    buyerMonthlyCost: 0, renterMonthlyCost: 0, homeValue: 0, remainingMortgage: 0, cumulativeBuyerWealthTax: 0,
  })

  it('returns null when one path leads throughout', () => {
    expect(findBreakevenYear([point(1, 1, 2), point(2, 1, 3)])).toBeNull()
    expect(findBreakevenYear([point(1, 5, 2), point(2, 6, 3)])).toBeNull()
  })

  it('returns the first year the leader changes', () => {
    expect(findBreakevenYear([point(1, 1, 2), point(2, 2, 2), point(3, 1, 5), point(4, 9, 5)])).toBe(2)
  })

  it('handles empty and single-year series', () => {
    expect(findBreakevenYear([])).toBeNull()
    expect(findBreakevenYear([point(1, 1, 2)])).toBeNull()
  })
})

describe('computeAnnualWealthTax', () => {
  it('is zero below the threshold', () => {
    expect(computeAnnualWealthTax(4_000_000, 3_000_000, 0, 200_000, 400_000)).toEqual({ buyerWealthTax: 0, renterWealthTax: 0 })
  })

  it('applies tiered primary-residence valuation above 10 MNOK', () => {
    const { buyerWealthTax } = computeAnnualWealthTax(20_000_000, 0, 0, 0, 0)
    expect(buyerWealthTax).toBeCloseTo((10_000_000 * 0.25 + 10_000_000 * 0.7 - 1_700_000) * 0.01, 6)
  })

  it('subtracts mortgage and shared debt from taxable home wealth', () => {
    const { buyerWealthTax } = computeAnnualWealthTax(20_000_000, 2_000_000, 1_000_000, 0, 0)
    expect(buyerWealthTax).toBeCloseTo((9_500_000 - 3_000_000 - 1_700_000) * 0.01, 6)
  })

  it('values savings at 100% and ASK at 80%', () => {
    const { renterWealthTax } = computeAnnualWealthTax(0, 0, 0, 2_000_000, 1_000_000)
    expect(renterWealthTax).toBeCloseTo((2_000_000 + 800_000 - 1_700_000) * 0.01, 6)
  })
})

describe('calculate — ASK taxation', () => {
  it('taxes ASK gains above the shielding deduction', () => {
    expect(calculate(with_({ askRate: 10, askShieldingRate: 0 }), 'advanced').summary.finalAskTax).toBeGreaterThan(0)
  })

  it('does not tax ASK gains fully covered by shielding', () => {
    expect(calculate(with_({ askRate: 3, askShieldingRate: 8 }), 'advanced').summary.finalAskTax).toBe(0)
  })

  it('never has ASK tax in quick mode', () => {
    expect(calculate(DEFAULT_INPUTS, 'quick').summary.finalAskTax).toBe(0)
  })
})

describe('normalizeInputs / robustness', () => {
  it('clamps the horizon to at least one whole year', () => {
    expect(normalizeInputs(with_({ years: 0 })).years).toBe(1)
    expect(normalizeInputs(with_({ years: 7.6 })).years).toBe(8)
    expect(() => calculate(with_({ years: 0 }), 'quick')).not.toThrow()
    expect(calculate(with_({ years: 0 }), 'quick').yearlyData).toHaveLength(1)
  })

  it('replaces non-finite and negative amounts', () => {
    const n = normalizeInputs(with_({ purchasePrice: NaN, monthlyRent: -500, loanTermYears: 0 }))
    expect(n.purchasePrice).toBe(0)
    expect(n.monthlyRent).toBe(0)
    expect(n.loanTermYears).toBe(1)
  })

  it('keeps negative rates such as falling home prices', () => {
    expect(normalizeInputs(with_({ appreciationRate: -2 })).appreciationRate).toBe(-2)
  })

  it('produces finite numbers for degenerate inputs', () => {
    const res = calculate(with_({ purchasePrice: 0, downPayment: 0, mortgageRate: 0, monthlyRent: 0 }), 'advanced')
    for (const y of res.yearlyData) {
      expect(Number.isFinite(y.buyerNetWorth)).toBe(true)
      expect(Number.isFinite(y.renterNetWorth)).toBe(true)
    }
  })
})
