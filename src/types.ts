export type Mode = 'quick' | 'advanced'
export type Lang = 'no' | 'en'
export type RecommendationType = 'buy' | 'rent'

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
  // Advanced – Rent
  contentsInsurance: number
  electricity: number
  internet: number
  parking: number
  // Advanced – Buy
  otherClosingCosts: number
  sharedDebt: number
  municipalFees: number
  renovationPct: number
  homeInsurance: number
  propertyTax: number
  hoaFeeIncrease: number
  // Advanced – Buy
  sharedDebtRate: number
  interestOnlyYears: number
  // Advanced – Financial
  savingsAccountBalance: number
  savingsAccountRate: number
  askRate: number
}

export interface YearlyDataPoint {
  year: number
  buyerMonthlyCost: number
  renterMonthlyCost: number
  buyerNetWorth: number
  renterNetWorth: number
  homeValue: number
  remainingMortgage: number
}

export interface Summary {
  monthlyMortgagePayment: number
  downPayment: number
  closingCosts: number
  totalBuyerPaid: number
  totalRenterPaid: number
  finalHomeValue: number
  finalEquity: number
  finalRenterPortfolio: number
  finalRemainingMortgage: number
  initialMonthlyRent: number
  initialBuyerMonthly: number
}

export interface CalculationResult {
  yearlyData: YearlyDataPoint[]
  recommendation: RecommendationType
  difference: number
  breakevenYear: number | null
  summary: Summary
}
