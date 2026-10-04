import type { NumericInputKey } from '../types'
import { BSU_MAX_CONTRIBUTION, MAX_HORIZON_YEARS, MAX_LOAN_TERM_YEARS } from './finance'

/** Largest krone amount the model will accept. Stays finite across a full horizon at the highest allowed growth. */
export const MAX_AMOUNT_KR = 1_000_000_000_000

/**
 * Highest price growth the breakeven search tries.
 * Wider than the form, which stops at 15%.
 */
export const BREAKEVEN_APPRECIATION_MAX = 20

/** Half-width of the sensitivity grid, in percentage points. Matches SENSITIVITY_OFFSETS. */
export const SENSITIVITY_SPAN = 2

export interface NumericBound {
  min: number
  max: number
}

const amount = (): NumericBound => ({ min: 0, max: MAX_AMOUNT_KR })

/** Limits a person can enter, store, or share. */
export const INPUT_BOUNDS: Record<NumericInputKey, NumericBound> = {
  monthlyRent: amount(),
  rentIncrease: { min: 0, max: 20 },
  purchasePrice: amount(),
  downPayment: amount(),
  mortgageRate: { min: 0.1, max: 15 },
  loanTermYears: { min: 1, max: MAX_LOAN_TERM_YEARS },
  monthlyHoaFee: amount(),
  stampDuty: amount(),
  brokerSellingFee: amount(),
  years: { min: 1, max: MAX_HORIZON_YEARS },
  appreciationRate: { min: -10, max: 15 },
  investmentReturn: { min: 0, max: 20 },
  inflation: { min: 0, max: 10 },
  contentsInsurance: amount(),
  electricity: amount(),
  internet: amount(),
  parking: amount(),
  otherClosingCosts: amount(),
  sharedDebt: amount(),
  municipalFees: amount(),
  renovationPct: { min: 0, max: 5 },
  homeInsurance: amount(),
  propertyTax: amount(),
  hoaFeeIncrease: { min: 0, max: 10 },
  sharedDebtRate: { min: 0, max: 15 },
  sharedDebtTermYears: { min: 0, max: 50 },
  interestOnlyYears: { min: 0, max: 10 },
  mortgageRateChangeYear: { min: 0, max: MAX_HORIZON_YEARS },
  mortgageRateAfterChange: { min: 0, max: 15 },
  savingsAccountBalance: amount(),
  savingsAccountRate: { min: 0, max: 20 },
  askBalance: amount(),
  askRate: { min: 0, max: 30 },
  askShieldingRate: { min: 0, max: 10 },
  bsuYearlyContribution: { min: 0, max: BSU_MAX_CONTRIBUTION * 2 },
  householdIncome: amount(),
  otherDebt: amount(),
  rentalIncome: amount(),
}

/**
 * Limits the simulator accepts. Wider than the form so the sensitivity grid
 * and the breakeven search can step outside what a person is allowed to type.
 */
export const MODEL_BOUNDS: Record<NumericInputKey, NumericBound> = {
  ...INPUT_BOUNDS,
  mortgageRate: { min: 0, max: INPUT_BOUNDS.mortgageRate.max + SENSITIVITY_SPAN },
  mortgageRateAfterChange: { min: 0, max: INPUT_BOUNDS.mortgageRateAfterChange.max + SENSITIVITY_SPAN },
  rentIncrease: { min: 0, max: INPUT_BOUNDS.rentIncrease.max + SENSITIVITY_SPAN },
  investmentReturn: { min: 0, max: INPUT_BOUNDS.investmentReturn.max + SENSITIVITY_SPAN },
  askRate: { min: 0, max: INPUT_BOUNDS.askRate.max + SENSITIVITY_SPAN },
  appreciationRate: {
    min: INPUT_BOUNDS.appreciationRate.min - SENSITIVITY_SPAN,
    max: Math.max(INPUT_BOUNDS.appreciationRate.max + SENSITIVITY_SPAN, BREAKEVEN_APPRECIATION_MAX),
  },
}

export const INTEGER_INPUT_KEYS = [
  'years',
  'loanTermYears',
  'interestOnlyYears',
  'sharedDebtTermYears',
  'mortgageRateChangeYear',
] as const satisfies readonly NumericInputKey[]
