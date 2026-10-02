export type Mode = 'quick' | 'advanced'
export type Lang = 'no' | 'en'
export type RecommendationType = 'buy' | 'rent'

export type NumericInputKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never
}[keyof Inputs]

export type BooleanInputKey = {
  [K in keyof Inputs]: Inputs[K] extends boolean ? K : never
}[keyof Inputs]

export type FormatKrFn = (value: number, compact?: boolean) => string
export type TranslateFn = (key: string, opts?: Record<string, unknown>) => string

export interface Inputs {
  monthlyRent: number
  rentIncrease: number
  purchasePrice: number
  downPayment: number
  mortgageRate: number
  loanTermYears: number
  monthlyHoaFee: number
  stampDuty: number
  brokerSellingFee: number
  years: number
  appreciationRate: number
  investmentReturn: number
  inflation: number
  contentsInsurance: number
  electricity: number
  internet: number
  parking: number
  otherClosingCosts: number
  sharedDebt: number
  municipalFees: number
  renovationPct: number
  homeInsurance: number
  propertyTax: number
  hoaFeeIncrease: number
  sharedDebtRate: number
  sharedDebtTermYears: number
  isBorettslag: boolean
  interestOnlyYears: number
  mortgageRateChangeYear: number
  mortgageRateAfterChange: number
  isCouple: boolean
  savingsAccountBalance: number
  savingsAccountRate: number
  askBalance: number
  askRate: number
  askShieldingRate: number
  bsuActive: boolean
  bsuYearlyContribution: number
  householdIncome: number
  otherDebt: number
  rentalIncome: number
}

export interface YearlyDataPoint {
  year: number
  buyerMonthlyCost: number
  renterMonthlyCost: number
  buyerNetWorth: number
  renterNetWorth: number
  homeValue: number
  remainingMortgage: number
  remainingSharedDebt: number
  buyerPortfolio: number
}

export interface RateChange {
  year: number
  ratePct: number
  monthlyPayment: number
}

export interface StressTest {
  ratePct: number
  monthlyPayment: number
  extraPerMonth: number
  debtPayment: number
}

export interface BuyerCostBreakdown {
  mortgage: number
  hoaFee: number
  utilities: number
  maintenance: number
  municipalFees: number
  insurance: number
  propertyTax: number
  interestDeduction: number
  rentalIncome: number
  total: number
}

export interface RenterCostBreakdown {
  rent: number
  extras: number
  bsuDeduction: number
  total: number
}

export interface Summary {
  monthlyMortgagePayment: number
  monthlyAmortizingPayment: number
  downPayment: number
  closingCosts: number
  initialInvestment: number
  securityDeposit: number
  year1BuyerCosts: BuyerCostBreakdown
  year1RenterCosts: RenterCostBreakdown
  totalBuyerPaid: number
  totalRenterPaid: number
  finalHomeValue: number
  finalEquity: number
  finalRenterPortfolio: number
  finalRenterNominalGross: number
  finalAskTax: number
  finalBuyerPortfolioGross: number
  finalBuyerAskTax: number
  finalRemainingMortgage: number
  finalBrokerFee: number
  initialMonthlyRent: number
  initialBuyerMonthly: number
  loanAmount: number
  monthlyRate: number
  numPayments: number
  ioYears: number
  remainingTermMonths: number
  finalInflationFactor: number
  finalSharedDebt: number
  rateChange: RateChange | null
  stressTest: StressTest
}

export interface CalculationResult {
  yearlyData: YearlyDataPoint[]
  recommendation: RecommendationType
  difference: number
  breakevenYear: number | null
  summary: Summary
}
