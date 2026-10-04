import { describe, expect, it } from 'vitest'
import {
  annuityPayment,
  calculate,
  clampInputs,
  computeAnnualWealthTax,
  computeStressTest,
  findBreakevenYear,
  normalizeInputs,
  wealthTaxOn,
} from './calculations'
import { INPUT_BOUNDS, MAX_AMOUNT_KR, MODEL_BOUNDS } from '../constants/inputBounds'
import { SENSITIVITY_OFFSETS, buildSensitivityGrid } from './sensitivity'
import { DEFAULT_INPUTS } from '../constants/defaults'
import {
  BSU_TAX_DEDUCTION_RATE,
  INTEREST_DEDUCTION,
  SAVINGS_TAX_RATE,
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
    [
      'advanced with interest-only, shared debt and BSU',
      with_({
        interestOnlyYears: 3,
        isBorettslag: true,
        sharedDebt: 500_000,
        bsuActive: true,
        years: 15,
      }),
      'advanced',
    ],
    [
      'advanced couple with a rate change',
      with_({
        isCouple: true,
        mortgageRateChangeYear: 4,
        mortgageRateAfterChange: 4,
        years: 12,
      }),
      'advanced',
    ],
    [
      'expensive home triggering wealth tax',
      with_({
        purchasePrice: 25_000_000,
        downPayment: 15_000_000,
        stampDuty: 625_000,
        savingsAccountBalance: 3_000_000,
        askBalance: 5_000_000,
        years: 20,
      }),
      'advanced',
    ],
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
    expect(summary.monthlyAmortizingPayment).toBeGreaterThan(
      calculate(with_({ loanTermYears: 25 }), 'advanced').summary.monthlyAmortizingPayment,
    )
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
    [
      'advanced + shared debt + IO + BSU',
      with_({ sharedDebt: 400_000, interestOnlyYears: 2, bsuActive: true, propertyTax: 3000 }),
      'advanced',
    ],
  ]

  it.each(cases)('components sum to the year-1 average monthly cost (%s)', (_n, inputs, mode) => {
    const { summary, yearlyData } = calculate(inputs, mode)
    const b = summary.year1BuyerCosts
    const buyerSum =
      b.mortgage +
      b.hoaFee +
      b.utilities +
      b.maintenance +
      b.municipalFees +
      b.insurance +
      b.propertyTax -
      b.interestDeduction
    expect(buyerSum).toBeCloseTo(yearlyData[0].buyerMonthlyCost, 6)
    expect(b.total).toBeCloseTo(yearlyData[0].buyerMonthlyCost, 6)

    const rc = summary.year1RenterCosts
    expect(rc.rent + rc.extras - rc.bsuDeduction).toBeCloseTo(yearlyData[0].renterMonthlyCost, 6)
  })

  it('deducts 22% of mortgage and shared-debt interest', () => {
    const inputs = with_({
      interestOnlyYears: 2,
      isBorettslag: true,
      sharedDebt: 600_000,
      sharedDebtRate: 5,
      sharedDebtTermYears: 0,
    })
    const { summary } = calculate(inputs, 'advanced')
    const expected = (summary.loanAmount * summary.monthlyRate + (600_000 * 0.05) / 12) * INTEREST_DEDUCTION
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
    const expected = (27_500 * BSU_TAX_DEDUCTION_RATE) / 12
    expect(off.yearlyData[0].renterMonthlyCost - on.yearlyData[0].renterMonthlyCost).toBeCloseTo(expected, 6)
  })

  it('keeps the BSU contribution as savings, so only the tax deduction is a gain', () => {
    const flat = with_({
      appreciationRate: 0,
      investmentReturn: 0,
      inflation: 0,
      rentIncrease: 0,
      hoaFeeIncrease: 0,
      savingsAccountRate: 0,
      askRate: 0,
      askShieldingRate: 0,
      savingsAccountBalance: 0,
      askBalance: 0,
      years: 1,
    })
    const off = calculate(flat, 'advanced')
    const on = calculate({ ...flat, bsuActive: true, bsuYearlyContribution: 27_500 }, 'advanced')
    const deduction = 27_500 * BSU_TAX_DEDUCTION_RATE
    expect(on.summary.finalRenterPortfolio - off.summary.finalRenterPortfolio).toBeCloseTo(deduction, 0)
  })

  it('uses the HOA increase field in quick mode', () => {
    const slow = calculate(with_({ hoaFeeIncrease: 0, years: 5 }), 'quick')
    const fast = calculate(with_({ hoaFeeIncrease: 10, years: 5 }), 'quick')
    expect(fast.yearlyData[4].buyerMonthlyCost).toBeGreaterThan(slow.yearlyData[4].buyerMonthlyCost)
  })

  it('ignores a borettslag exemption in quick mode', () => {
    const coop = with_({ isBorettslag: true, stampDuty: 0, sharedDebt: 800_000 })
    const quick = calculate(coop, 'quick')
    const freehold = calculate(DEFAULT_INPUTS, 'quick')
    expect(quick.summary.closingCosts).toBe(freehold.summary.closingCosts)
    expect(quick.summary.finalSharedDebt).toBe(0)
    expect(quick.summary.finalEquity).toBeCloseTo(freehold.summary.finalEquity, 4)
    expect(calculate(coop, 'advanced').summary.closingCosts).toBe(DEFAULT_INPUTS.otherClosingCosts)
  })
})

describe('calculate — net worth, recommendation and breakeven', () => {
  it('values every year as an exit at that point (broker fee and deposit included each year)', () => {
    const inputs = with_({ isBorettslag: true, sharedDebt: 300_000, years: 12 })
    const { yearlyData } = calculate(inputs, 'advanced')
    for (const y of yearlyData) {
      const infl = Math.pow(1 + inputs.inflation / 100, y.year)
      const brokerFee = inputs.brokerSellingFee * Math.pow(1 + inputs.appreciationRate / 100, y.year)
      const expected = (y.homeValue - y.remainingMortgage - y.remainingSharedDebt - brokerFee + y.buyerPortfolio) / infl
      expect(y.buyerNetWorth).toBeCloseTo(expected, 4)
    }
  })

  const flat = with_({
    appreciationRate: 0,
    investmentReturn: 0,
    inflation: 0,
    rentIncrease: 0,
    hoaFeeIncrease: 0,
    savingsAccountRate: 0,
    askRate: 0,
    askShieldingRate: 0,
  })

  it.each(['quick', 'advanced'] as const)(
    'gives the renter the down payment and closing costs as starting capital (%s)',
    mode => {
      const { yearlyData, summary } = calculate(with_({ ...flat, years: 1 }), mode)
      const y = yearlyData[0]
      const existing = mode === 'advanced' ? flat.savingsAccountBalance + flat.askBalance : 0
      const diff = 12 * (y.buyerMonthlyCost - y.renterMonthlyCost)
      expect(diff).toBeGreaterThan(0)
      expect(y.renterNetWorth).toBeCloseTo(existing + summary.initialInvestment + diff, 4)
      expect(y.buyerPortfolio).toBeCloseTo(existing, 4)
    },
  )

  it.each(['quick', 'advanced'] as const)('lets the buyer invest the difference when renting costs more (%s)', mode => {
    const inputs = with_({ ...flat, monthlyRent: 40_000, savingsAccountBalance: 0, askBalance: 0, years: 5 })
    const { yearlyData, summary } = calculate(inputs, mode)
    const saved = yearlyData.reduce((acc, y) => acc + 12 * (y.renterMonthlyCost - y.buyerMonthlyCost), 0)
    const last = yearlyData[yearlyData.length - 1]
    expect(saved).toBeGreaterThan(0)
    expect(last.buyerPortfolio).toBeCloseTo(saved, 4)
    expect(last.renterNetWorth).toBeCloseTo(summary.initialInvestment, 4)
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
    expect(last.buyerNetWorth).toBeCloseTo(last.homeValue - last.remainingMortgage - summary.finalBrokerFee, 4)
  })

  it('grows the broker fee with house prices and keeps it flat when prices are flat', () => {
    const growing = calculate(with_({ appreciationRate: 3, years: 10 }), 'quick').summary
    expect(growing.finalBrokerFee).toBeCloseTo(DEFAULT_INPUTS.brokerSellingFee * Math.pow(1.03, 10), 6)
    const flatPrices = calculate(with_({ appreciationRate: 0 }), 'quick').summary
    expect(flatPrices.finalBrokerFee).toBe(DEFAULT_INPUTS.brokerSellingFee)
  })
})

describe('calculate — rental income from part of the home', () => {
  it('lowers the buyer cost by the rental income in advanced mode only', () => {
    const off = calculate(with_({ rentalIncome: 0 }), 'advanced')
    const on = calculate(with_({ rentalIncome: 6_000 }), 'advanced')
    expect(off.yearlyData[0].buyerMonthlyCost - on.yearlyData[0].buyerMonthlyCost).toBeCloseTo(6_000, 6)
    expect(on.summary.year1BuyerCosts.rentalIncome).toBeCloseTo(6_000, 6)
    const gap = (r: CalculationResult) => r.summary.finalEquity - r.summary.finalRenterPortfolio
    expect(gap(on)).toBeGreaterThan(gap(off))

    const quick = calculate(with_({ rentalIncome: 6_000 }), 'quick')
    expect(quick.yearlyData[0].buyerMonthlyCost).toBeCloseTo(
      calculate(DEFAULT_INPUTS, 'quick').yearlyData[0].buyerMonthlyCost,
      6,
    )
  })

  it('raises the rental income each year in line with rent', () => {
    const { yearlyData } = calculate(with_({ rentalIncome: 6_000, rentIncrease: 4, years: 3 }), 'advanced')
    const baseline = calculate(with_({ rentalIncome: 0, rentIncrease: 4, years: 3 }), 'advanced').yearlyData
    expect(baseline[2].buyerMonthlyCost - yearlyData[2].buyerMonthlyCost).toBeCloseTo(6_000 * 1.04 ** 2, 6)
  })
})

describe('findBreakevenYear', () => {
  const point = (year: number, buyer: number, renter: number): YearlyDataPoint => ({
    year,
    buyerNetWorth: buyer,
    renterNetWorth: renter,
    buyerMonthlyCost: 0,
    renterMonthlyCost: 0,
    homeValue: 0,
    remainingMortgage: 0,
    remainingSharedDebt: 0,
    buyerPortfolio: 0,
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
  const none = { savings: 0, ask: 0 }

  it('is zero below the threshold', () => {
    const assets = { savings: 200_000, ask: 400_000 }
    expect(computeAnnualWealthTax(4_000_000, 3_000_000, 0, assets, assets)).toEqual({
      buyerWealthTax: 0,
      renterWealthTax: 0,
    })
  })

  it('applies tiered primary-residence valuation above 14 MNOK', () => {
    const { buyerWealthTax } = computeAnnualWealthTax(20_000_000, 0, 0, none, none)
    expect(buyerWealthTax).toBeCloseTo((14_000_000 * 0.25 + 6_000_000 * 0.7 - 1_900_000) * 0.01, 6)
  })

  it('subtracts mortgage and shared debt from taxable home wealth', () => {
    const { buyerWealthTax } = computeAnnualWealthTax(20_000_000, 2_000_000, 1_000_000, none, none)
    expect(buyerWealthTax).toBeCloseTo((7_700_000 - 3_000_000 - 1_900_000) * 0.01, 6)
  })

  it('values savings at 100% and ASK at 80%', () => {
    const { renterWealthTax } = computeAnnualWealthTax(0, 0, 0, none, { savings: 2_000_000, ask: 1_000_000 })
    expect(renterWealthTax).toBeCloseTo((2_000_000 + 800_000 - 1_900_000) * 0.01, 6)
  })

  it("adds the buyer's savings and ASK to home wealth, net of all debt", () => {
    const { buyerWealthTax } = computeAnnualWealthTax(
      8_000_000,
      1_000_000,
      0,
      { savings: 1_000_000, ask: 2_000_000 },
      none,
    )
    expect(buyerWealthTax).toBeCloseTo((2_000_000 + 1_000_000 + 1_600_000 - 1_000_000 - 1_900_000) * 0.01, 6)
  })
})

describe('wealthTaxOn', () => {
  it('is zero up to the 1.9 MNOK allowance', () => {
    expect(wealthTaxOn(0)).toBe(0)
    expect(wealthTaxOn(1_900_000)).toBe(0)
  })

  it('charges 1.0% up to 21.5 MNOK and 1.1% above', () => {
    expect(wealthTaxOn(21_500_000)).toBeCloseTo(19_600_000 * 0.01, 6)
    expect(wealthTaxOn(30_000_000)).toBeCloseTo(19_600_000 * 0.01 + 8_500_000 * 0.011, 6)
  })

  it('doubles both thresholds for couples taxed jointly', () => {
    expect(wealthTaxOn(3_800_000, true)).toBe(0)
    expect(wealthTaxOn(5_000_000, true)).toBeCloseTo(1_200_000 * 0.01, 6)
    expect(wealthTaxOn(50_000_000, true)).toBeCloseTo(39_200_000 * 0.01 + 7_000_000 * 0.011, 6)
  })
})

describe('calculate — ASK taxation', () => {
  it('taxes ASK gains above the shielding deduction', () => {
    expect(calculate(with_({ askRate: 10, askShieldingRate: 0 }), 'advanced').summary.finalAskTax).toBeGreaterThan(0)
  })

  it('does not tax ASK gains fully covered by shielding', () => {
    expect(calculate(with_({ askRate: 3, askShieldingRate: 8 }), 'advanced').summary.finalAskTax).toBe(0)
  })

  it('taxes quick-mode returns as savings-account interest: 22% yearly, nothing on exit', () => {
    const inputs = with_({ investmentReturn: 6, inflation: 0, years: 10, monthlyRent: 50_000 })
    const { summary } = calculate(inputs, 'quick')
    expect(summary.finalAskTax).toBe(0)
    expect(summary.finalRenterNominalGross).toBeCloseTo(
      summary.initialInvestment * Math.pow(1 + 0.06 * (1 - SAVINGS_TAX_RATE), 10),
      2,
    )
  })
})

describe('calculate — shared costs, shared debt and deposit', () => {
  it('charges buyer and renter the same electricity, internet, contents insurance and parking', () => {
    const inputs = with_({ contentsInsurance: 3_000, electricity: 15_000, internet: 6_000, parking: 800 })
    const { summary } = calculate(inputs, 'advanced')
    const expected = (3_000 + 15_000 + 6_000 + 800 * 12) / 12
    expect(summary.year1BuyerCosts.utilities).toBeCloseTo(expected, 6)
    expect(summary.year1RenterCosts.extras).toBeCloseTo(expected, 6)
  })

  it('ignores shared debt unless the home is a borettslag', () => {
    const selveier = calculate(with_({ sharedDebt: 500_000, isBorettslag: false }), 'advanced')
    expect(selveier.summary.finalSharedDebt).toBe(0)
    expect(selveier.summary.finalEquity).toBeCloseTo(calculate(DEFAULT_INPUTS, 'advanced').summary.finalEquity, 6)
  })

  it('pays shared debt down over its term, or keeps it flat when interest-only', () => {
    const base = { isBorettslag: true, sharedDebt: 500_000, sharedDebtRate: 5, years: 10 }
    expect(calculate(with_({ ...base, sharedDebtTermYears: 10 }), 'advanced').summary.finalSharedDebt).toBe(0)
    expect(calculate(with_({ ...base, sharedDebtTermYears: 0 }), 'advanced').summary.finalSharedDebt).toBe(500_000)
    const halfway = calculate(with_({ ...base, sharedDebtTermYears: 20 }), 'advanced').summary.finalSharedDebt
    const r = 0.05 / 12
    const expected = (500_000 * (Math.pow(1 + r, 240) - Math.pow(1 + r, 120))) / (Math.pow(1 + r, 240) - 1)
    expect(halfway).toBeCloseTo(expected, 4)
  })

  it('lets the security deposit earn savings interest after tax', () => {
    const inputs = with_({
      appreciationRate: 0,
      inflation: 0,
      rentIncrease: 0,
      hoaFeeIncrease: 0,
      askRate: 0,
      askShieldingRate: 0,
      savingsAccountRate: 5,
      savingsAccountBalance: 0,
      askBalance: 0,
      monthlyRent: 40_000,
      years: 5,
    })
    const { summary, yearlyData } = calculate(inputs, 'advanced')
    const deposit = summary.securityDeposit
    const grown = deposit * Math.pow(1 + 0.05 * (1 - SAVINGS_TAX_RATE), 5)
    expect(yearlyData[4].renterNetWorth).toBeCloseTo(summary.initialInvestment - deposit + grown, 2)
  })
})

describe('calculate — mortgage rate change', () => {
  it('recalculates the payment on the remaining loan from the chosen year', () => {
    const inputs = with_({ mortgageRateChangeYear: 4, mortgageRateAfterChange: 3.5, years: 10 })
    const { summary, yearlyData } = calculate(inputs, 'advanced')
    const change = summary.rateChange!
    expect(change.year).toBe(4)
    expect(change.ratePct).toBe(3.5)
    const monthsLeft = summary.numPayments - 36
    expect(change.monthlyPayment).toBeCloseTo(
      annuityPayment(yearlyData[2].remainingMortgage, 0.035 / 12, monthsLeft),
      6,
    )
    expect(change.monthlyPayment).toBeLessThan(summary.monthlyAmortizingPayment)
  })

  it('leaves years before the change untouched and repays the loan by the end of the term', () => {
    const base = calculate(with_({ years: 10 }), 'advanced').yearlyData
    const changed = calculate(with_({ mortgageRateChangeYear: 4, mortgageRateAfterChange: 8, years: 10 }), 'advanced')
    for (let i = 0; i < 3; i++) expect(changed.yearlyData[i].buyerMonthlyCost).toBeCloseTo(base[i].buyerMonthlyCost, 6)
    expect(changed.yearlyData[3].buyerMonthlyCost).toBeGreaterThan(base[3].buyerMonthlyCost)
    const full = calculate(
      with_({ mortgageRateChangeYear: 4, mortgageRateAfterChange: 8, loanTermYears: 10, years: 10 }),
      'advanced',
    )
    expect(full.summary.finalRemainingMortgage).toBe(0)
  })

  it('has no rate change when the year is 0, beyond the horizon, or in quick mode', () => {
    expect(calculate(DEFAULT_INPUTS, 'advanced').summary.rateChange).toBeNull()
    expect(calculate(with_({ mortgageRateChangeYear: 20, years: 10 }), 'advanced').summary.rateChange).toBeNull()
    expect(calculate(with_({ mortgageRateChangeYear: 3 }), 'quick').summary.rateChange).toBeNull()
  })
})

describe('computeStressTest', () => {
  it('adds 3 percentage points to the mortgage rate', () => {
    const inputs = with_({ mortgageRate: 5.5 })
    const stress = computeStressTest(inputs, 'quick')
    const loan = inputs.purchasePrice - inputs.downPayment
    expect(stress.ratePct).toBe(8.5)
    expect(stress.monthlyPayment).toBeCloseTo(annuityPayment(loan, 0.085 / 12, 300), 6)
    expect(stress.extraPerMonth).toBeCloseTo(stress.monthlyPayment - annuityPayment(loan, 0.055 / 12, 300), 6)
  })

  it('uses at least 7%', () => {
    expect(computeStressTest(with_({ mortgageRate: 3 }), 'quick').ratePct).toBe(7)
  })

  it('includes the higher interest on shared debt for a borettslag', () => {
    const plain = computeStressTest(DEFAULT_INPUTS, 'advanced')
    const coop = computeStressTest(with_({ isBorettslag: true, sharedDebt: 600_000, sharedDebtRate: 5 }), 'advanced')
    expect(coop.extraPerMonth - plain.extraPerMonth).toBeCloseTo((600_000 * 0.03) / 12, 6)
    expect(coop.debtPayment - plain.debtPayment).toBeCloseTo((600_000 * 0.03) / 12, 6)
  })

  it('prices other debt as interest-only at the stress rate, and only in advanced mode', () => {
    const plain = computeStressTest(DEFAULT_INPUTS, 'advanced')
    const withDebt = computeStressTest(with_({ otherDebt: 240_000 }), 'advanced')
    expect(withDebt.extraPerMonth - plain.extraPerMonth).toBeCloseTo((240_000 * (withDebt.ratePct / 100)) / 12, 6)
    expect(computeStressTest(with_({ otherDebt: 240_000 }), 'quick').extraPerMonth).toBeCloseTo(plain.extraPerMonth, 6)
  })
})

describe('calculate — compounding', () => {
  const lumpSum = (overrides: Partial<Inputs>) =>
    with_({
      inflation: 0,
      askShieldingRate: 0,
      years: 10,
      monthlyRent: 0,
      monthlyHoaFee: 0,
      purchasePrice: 0,
      downPayment: 0,
      stampDuty: 0,
      otherClosingCosts: 0,
      electricity: 0,
      internet: 0,
      contentsInsurance: 0,
      municipalFees: 0,
      homeInsurance: 0,
      ...overrides,
    })

  it('grows savings at the stated annual rate after 22% tax', () => {
    const { summary } = calculate(
      lumpSum({ savingsAccountBalance: 1_000_000, savingsAccountRate: 5, askBalance: 0 }),
      'advanced',
    )
    expect(summary.finalRenterNominalGross).toBeCloseTo(1_000_000 * Math.pow(1 + 0.05 * (1 - SAVINGS_TAX_RATE), 10), 2)
  })

  it('grows ASK at the stated annual rate', () => {
    const { summary } = calculate(lumpSum({ savingsAccountBalance: 0, askBalance: 1_000_000, askRate: 7 }), 'advanced')
    expect(summary.finalRenterNominalGross).toBeCloseTo(1_000_000 * Math.pow(1.07, 10), 2)
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

  it('clamps shared and stored scenarios to the form limits', () => {
    const clamped = clampInputs(
      with_({
        purchasePrice: Number.MAX_VALUE,
        monthlyRent: Number.MAX_VALUE,
        mortgageRate: 1e6,
        appreciationRate: 1e6,
        loanTermYears: 1e6,
        years: 1e6,
        rentIncrease: -4,
      }),
    )
    expect(clamped.purchasePrice).toBe(MAX_AMOUNT_KR)
    expect(clamped.monthlyRent).toBe(MAX_AMOUNT_KR)
    expect(clamped.mortgageRate).toBe(INPUT_BOUNDS.mortgageRate.max)
    expect(clamped.appreciationRate).toBe(INPUT_BOUNDS.appreciationRate.max)
    expect(clamped.loanTermYears).toBe(INPUT_BOUNDS.loanTermYears.max)
    expect(clamped.years).toBe(INPUT_BOUNDS.years.max)
    expect(clamped.rentIncrease).toBe(0)

    const res = calculate(clamped, 'advanced')
    expect(res.yearlyData).toHaveLength(INPUT_BOUNDS.years.max)
    for (const y of res.yearlyData) {
      expect(Number.isFinite(y.buyerNetWorth)).toBe(true)
      expect(Number.isFinite(y.renterNetWorth)).toBe(true)
      expect(Number.isFinite(y.homeValue)).toBe(true)
    }
  })

  it('leaves room outside the form for sensitivity and the breakeven search', () => {
    const span = Math.max(...SENSITIVITY_OFFSETS.map(offset => Math.abs(offset)))
    expect(MODEL_BOUNDS.mortgageRate.max).toBeGreaterThanOrEqual(INPUT_BOUNDS.mortgageRate.max + span)
    expect(MODEL_BOUNDS.appreciationRate.max).toBeGreaterThanOrEqual(INPUT_BOUNDS.appreciationRate.max + span)
    expect(normalizeInputs(with_({ appreciationRate: MODEL_BOUNDS.appreciationRate.max })).appreciationRate).toBe(
      MODEL_BOUNDS.appreciationRate.max,
    )
    expect(normalizeInputs(with_({ mortgageRate: 0 })).mortgageRate).toBe(0)

    const atCap = clampInputs(
      with_({
        mortgageRate: INPUT_BOUNDS.mortgageRate.max,
        appreciationRate: INPUT_BOUNDS.appreciationRate.max,
      }),
    )
    const grid = buildSensitivityGrid(atCap, 'quick')
    const advantages = grid.rows.flatMap(row => row.cells.map(cell => cell.buyAdvantage))
    expect(advantages.length).toBeGreaterThan(1)
    expect(new Set(advantages).size).toBe(advantages.length)
    for (const advantage of advantages) expect(Number.isFinite(advantage)).toBe(true)
  })
})
