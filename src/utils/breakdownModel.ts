import {
  ASK_TAX_RATE,
  FINANCIAL_ASSET_VALUATION,
  INTEREST_DEDUCTION,
  PRIMARY_RESIDENCE_HIGH_THRESHOLD,
  PRIMARY_RESIDENCE_HIGH_VALUATION,
  PRIMARY_RESIDENCE_VALUATION,
  QUICK_INVESTMENT_TAX,
  SAVINGS_TAX_RATE,
  SAVINGS_VALUATION,
  WEALTH_TAX_RATE,
  WEALTH_TAX_THRESHOLD,
} from '../constants/finance'
import { formatPct } from './formatting'
import type { CalculationResult, FormatKrFn, Inputs, Mode, YearlyDataPoint } from '../types'

export type Sign = '+' | '−'

export interface BreakdownLine {
  id: string
  labelKey: string
  labelOpts?: Record<string, unknown>
  amount: number
  sign: Sign
}

export interface MortgageModel {
  loanAmount: number
  ratePct: number
  monthlyRate: number
  loanTermYears: number
  numPayments: number
  ioYears: number
  remainingTermMonths: number
  ioPayment: number
  amortizingPayment: number
}

export interface BreakdownModel {
  isAdvanced: boolean
  years: number
  finalYear: YearlyDataPoint
  inflationFactor: number
  mortgage: MortgageModel
  buyerCostLines: BreakdownLine[]
  buyerMonthlyTotal: number
  buyerNetWorthLines: BreakdownLine[]
  buyerNetWorth: number
  closingCosts: number
  initialInvestment: number
  securityDeposit: number
  renterNetWorthLines: BreakdownLine[]
  renterNetWorth: number
}

export const INTEREST_DEDUCTION_PCT = Math.round(INTEREST_DEDUCTION * 100)

export interface TaxRuleParams {
  interestDeduction: string
  savingsTax: string
  quickTax: string
  askTax: string
  homeValuation: string
  homeHighValuation: string
  homeHighThreshold: string
  savingsValuation: string
  askValuation: string
  wealthTaxRate: string
  wealthTaxThreshold: string
}

export function buildTaxRuleParams(locale: string, formatKr: FormatKrFn): TaxRuleParams {
  const pct = (fraction: number) => formatPct(fraction * 100, locale)
  return {
    interestDeduction: pct(INTEREST_DEDUCTION),
    savingsTax: pct(SAVINGS_TAX_RATE),
    quickTax: pct(QUICK_INVESTMENT_TAX),
    askTax: pct(ASK_TAX_RATE),
    homeValuation: pct(PRIMARY_RESIDENCE_VALUATION),
    homeHighValuation: pct(PRIMARY_RESIDENCE_HIGH_VALUATION),
    homeHighThreshold: formatKr(PRIMARY_RESIDENCE_HIGH_THRESHOLD),
    savingsValuation: pct(SAVINGS_VALUATION),
    askValuation: pct(FINANCIAL_ASSET_VALUATION),
    wealthTaxRate: formatPct(WEALTH_TAX_RATE, locale, 2),
    wealthTaxThreshold: formatKr(WEALTH_TAX_THRESHOLD),
  }
}

export function sumLines(lines: BreakdownLine[]): number {
  return lines.reduce((acc, l) => acc + (l.sign === '+' ? l.amount : -l.amount), 0)
}

function line(id: string, labelKey: string, amount: number, sign: Sign, labelOpts?: Record<string, unknown>): BreakdownLine {
  return { id, labelKey, amount, sign, labelOpts }
}

export function buildBreakdownModel(results: CalculationResult, inputs: Inputs, mode: Mode): BreakdownModel {
  const isAdvanced = mode === 'advanced'
  const { summary, yearlyData } = results
  const finalYear = yearlyData[yearlyData.length - 1]
  const costs = summary.year1BuyerCosts

  const optionalCosts: BreakdownLine[] = [
    line('utilities', 'breakdown.utilities', costs.utilities, '+'),
    line('maintenance', 'inputs.renovationPct', costs.maintenance, '+'),
    line('municipalFees', 'inputs.municipalFees', costs.municipalFees, '+'),
    line('insurance', 'inputs.homeInsurance', costs.insurance, '+'),
    line('propertyTax', 'inputs.propertyTax', costs.propertyTax, '+'),
  ].filter(l => l.amount > 0)

  const buyerCostLines: BreakdownLine[] = [
    line('mortgage', 'breakdown.mortgagePayment', costs.mortgage, '+'),
    line('hoaFee', 'inputs.monthlyHoaFee', costs.hoaFee, '+'),
    line('interestDeduction', 'breakdown.interestDeductionPct', costs.interestDeduction, '−', { pct: INTEREST_DEDUCTION_PCT }),
    ...optionalCosts,
  ]

  const buyerNetWorthLines: BreakdownLine[] = [
    line('homeValue', 'breakdown.homeValue', finalYear.homeValue, '+'),
    line('remainingMortgage', 'breakdown.remainingMortgage', finalYear.remainingMortgage, '−'),
    ...(inputs.sharedDebt > 0 ? [line('sharedDebt', 'inputs.sharedDebt', inputs.sharedDebt, '−')] : []),
    line('brokerSellingFee', 'inputs.brokerSellingFee', inputs.brokerSellingFee, '−'),
    ...(finalYear.cumulativeBuyerWealthTax > 0
      ? [line('wealthTax', 'breakdown.accumulatedWealthTax', finalYear.cumulativeBuyerWealthTax, '−')]
      : []),
  ]

  const renterNetWorthLines: BreakdownLine[] = [
    line('portfolioGross', 'breakdown.portfolioGross', summary.finalRenterNominalGross, '+'),
    ...(summary.finalAskTax > 0 ? [line('askTax', 'breakdown.askCapitalGainsTax', summary.finalAskTax, '−')] : []),
  ]

  return {
    isAdvanced,
    years: yearlyData.length,
    finalYear,
    inflationFactor: summary.finalInflationFactor,
    mortgage: {
      loanAmount: summary.loanAmount,
      ratePct: inputs.mortgageRate,
      monthlyRate: summary.monthlyRate,
      loanTermYears: summary.numPayments / 12,
      numPayments: summary.numPayments,
      ioYears: summary.ioYears,
      remainingTermMonths: summary.remainingTermMonths,
      ioPayment: summary.loanAmount * summary.monthlyRate,
      amortizingPayment: summary.monthlyAmortizingPayment,
    },
    buyerCostLines,
    buyerMonthlyTotal: costs.total,
    buyerNetWorthLines,
    buyerNetWorth: summary.finalEquity,
    closingCosts: summary.closingCosts,
    initialInvestment: summary.initialInvestment,
    securityDeposit: summary.securityDeposit,
    renterNetWorthLines,
    renterNetWorth: summary.finalRenterPortfolio,
  }
}
