import type {
  Inputs, Mode, CalculationResult, YearlyDataPoint, Summary, BuyerCostBreakdown, RenterCostBreakdown,
} from '../types'
import {
  WEALTH_TAX_THRESHOLD,
  WEALTH_TAX_RATE,
  WEALTH_TAX_HIGH_THRESHOLD,
  WEALTH_TAX_HIGH_RATE,
  PRIMARY_RESIDENCE_VALUATION,
  PRIMARY_RESIDENCE_HIGH_THRESHOLD,
  PRIMARY_RESIDENCE_HIGH_VALUATION,
  SAVINGS_VALUATION,
  FINANCIAL_ASSET_VALUATION,
  INTEREST_DEDUCTION,
  SAVINGS_TAX_RATE,
  ASK_TAX_RATE,
  QUICK_INVESTMENT_TAX,
  SECURITY_DEPOSIT_MONTHS,
  BSU_TAX_DEDUCTION_RATE,
  DEFAULT_HOA_INCREASE_PCT,
  MAX_HORIZON_YEARS,
} from '../constants/finance'

interface SimParams {
  effectivePrice: number
  downPayment: number
  loanAmount: number
  closingCosts: number
  monthlyRate: number
  ioYears: number
  numPayments: number
  remainingTermMonths: number
  monthlyAmortizingPayment: number
  initialInvestment: number
  securityDeposit: number
  savingsInitial: number
  askInitial: number
  cashMonthlyReturn: number
  askMonthlyReturn: number
  bsuMonthlySaving: number
  advancedRentMonthly: number
  sharedUtilitiesMonthly: number
  municipalFeesBase: number
  insuranceMonthly: number
  propertyTaxMonthly: number
  sharedDebtMonthlyInterest: number
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

export function normalizeInputs(inputs: Inputs): Inputs {
  const next = { ...inputs }
  for (const key of Object.keys(next) as (keyof Inputs)[]) {
    const value = next[key]
    if (typeof value === 'number') {
      (next as Record<keyof Inputs, number | boolean>)[key] = finiteOr(value, 0)
    }
  }
  const nonNegative = [
    'monthlyRent', 'purchasePrice', 'downPayment', 'monthlyHoaFee', 'stampDuty', 'brokerSellingFee',
    'contentsInsurance', 'electricity', 'internet', 'parking', 'otherClosingCosts', 'sharedDebt',
    'municipalFees', 'renovationPct', 'homeInsurance', 'propertyTax', 'mortgageRate', 'sharedDebtRate',
    'savingsAccountBalance', 'askBalance', 'askShieldingRate', 'bsuYearlyContribution',
  ] as const
  for (const key of nonNegative) next[key] = Math.max(0, next[key])

  next.years = Math.min(MAX_HORIZON_YEARS, Math.max(1, Math.round(next.years)))
  next.loanTermYears = Math.max(1, Math.round(next.loanTermYears))
  next.interestOnlyYears = Math.max(0, Math.round(next.interestOnlyYears))
  return next
}

function computeSimParams(inputs: Inputs, isAdvanced: boolean): SimParams {
  const {
    purchasePrice, downPayment, mortgageRate, loanTermYears, stampDuty,
    otherClosingCosts, interestOnlyYears, monthlyRent, investmentReturn,
    savingsAccountBalance, askBalance, savingsAccountRate, askRate,
    bsuActive, bsuYearlyContribution, contentsInsurance, electricity,
    internet, parking, municipalFees, homeInsurance, propertyTax,
    sharedDebt, sharedDebtRate,
  } = inputs

  const loanAmount = Math.max(0, purchasePrice - downPayment)
  const closingCosts = stampDuty + (isAdvanced ? otherClosingCosts : 0)
  const monthlyRate = mortgageRate / 100 / 12
  const ioYears = isAdvanced ? Math.min(interestOnlyYears, loanTermYears - 1) : 0
  const numPayments = loanTermYears * 12
  const remainingTermMonths = numPayments - ioYears * 12

  const monthlyAmortizingPayment =
    remainingTermMonths > 0
      ? monthlyRate > 0
        ? loanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, remainingTermMonths)) /
          (Math.pow(1 + monthlyRate, remainingTermMonths) - 1)
        : loanAmount / remainingTermMonths
      : 0

  const securityDeposit = isAdvanced ? monthlyRent * SECURITY_DEPOSIT_MONTHS : 0

  return {
    effectivePrice: purchasePrice + sharedDebt,
    downPayment,
    loanAmount,
    closingCosts,
    monthlyRate,
    ioYears,
    numPayments,
    remainingTermMonths,
    monthlyAmortizingPayment,
    initialInvestment: downPayment + closingCosts,
    securityDeposit,
    savingsInitial: isAdvanced ? savingsAccountBalance : 0,
    askInitial: isAdvanced ? askBalance : 0,
    cashMonthlyReturn: isAdvanced
      ? savingsAccountRate / 100 / 12 * (1 - SAVINGS_TAX_RATE)
      : investmentReturn / 100 / 12 * (1 - QUICK_INVESTMENT_TAX),
    askMonthlyReturn: askRate / 100 / 12,
    bsuMonthlySaving: isAdvanced && bsuActive ? bsuYearlyContribution * BSU_TAX_DEDUCTION_RATE / 12 : 0,
    advancedRentMonthly: isAdvanced ? (contentsInsurance + electricity + internet + parking * 12) / 12 : 0,
    sharedUtilitiesMonthly: isAdvanced ? (electricity + internet) / 12 : 0,
    municipalFeesBase: isAdvanced ? municipalFees / 12 : 0,
    insuranceMonthly: isAdvanced ? homeInsurance / 12 : 0,
    propertyTaxMonthly: isAdvanced ? propertyTax / 12 : 0,
    sharedDebtMonthlyInterest: isAdvanced ? sharedDebt * (sharedDebtRate / 100) / 12 : 0,
  }
}

function computeMonthlyMortgage(
  remainingMortgage: number,
  monthlyRate: number,
  monthlyAmortizingPayment: number,
  isInterestOnly: boolean,
): { effectiveMortgage: number; principalPayment: number; interestPayment: number } {
  if (remainingMortgage <= 0) {
    return { effectiveMortgage: 0, principalPayment: 0, interestPayment: 0 }
  }
  const interestPayment = remainingMortgage * monthlyRate
  if (isInterestOnly) {
    return { effectiveMortgage: interestPayment, principalPayment: 0, interestPayment }
  }
  const principalPayment = Math.min(monthlyAmortizingPayment - interestPayment, remainingMortgage)
  return { effectiveMortgage: principalPayment + interestPayment, principalPayment, interestPayment }
}

export interface FinancialAssets {
  savings: number
  ask: number
}

interface Holdings extends FinancialAssets {
  askCostBasis: number
  askShielding: number
}

function newHoldings(savings: number, ask: number): Holdings {
  return { savings, ask, askCostBasis: ask, askShielding: 0 }
}

function invest(h: Holdings, amount: number, isAdvanced: boolean): void {
  if (isAdvanced) {
    h.ask += amount
    h.askCostBasis += amount
  } else {
    h.savings += amount
  }
}

// Draws from savings, then ASK (deposits come out tax-free first); any remainder leaves savings negative.
function withdraw(h: Holdings, amount: number): void {
  const fromSavings = Math.max(0, Math.min(amount, h.savings))
  const fromAsk = Math.max(0, Math.min(amount - fromSavings, h.ask))
  h.ask -= fromAsk
  h.askCostBasis = Math.max(0, h.askCostBasis - fromAsk)
  h.savings -= amount - fromAsk
}

function askTaxOnExit(h: Holdings): number {
  const gains = Math.max(0, h.ask - h.askCostBasis)
  return Math.max(0, gains - h.askShielding) * ASK_TAX_RATE
}

export function computeAnnualWealthTax(
  homeValue: number,
  remainingMortgage: number,
  sharedDebt: number,
  buyerAssets: FinancialAssets,
  renterAssets: FinancialAssets,
): { buyerWealthTax: number; renterWealthTax: number } {
  const homeValueForWealthTax =
    Math.min(homeValue, PRIMARY_RESIDENCE_HIGH_THRESHOLD) * PRIMARY_RESIDENCE_VALUATION +
    Math.max(0, homeValue - PRIMARY_RESIDENCE_HIGH_THRESHOLD) * PRIMARY_RESIDENCE_HIGH_VALUATION
  const financialValue = (a: FinancialAssets) => a.savings * SAVINGS_VALUATION + a.ask * FINANCIAL_ASSET_VALUATION

  const buyerTaxableWealth = Math.max(
    0,
    homeValueForWealthTax + financialValue(buyerAssets) - remainingMortgage - sharedDebt,
  )
  const renterTaxableWealth = Math.max(0, financialValue(renterAssets))

  return {
    buyerWealthTax: wealthTaxOn(buyerTaxableWealth),
    renterWealthTax: wealthTaxOn(renterTaxableWealth),
  }
}

export function wealthTaxOn(netWealth: number): number {
  const lowBand = Math.max(0, Math.min(netWealth, WEALTH_TAX_HIGH_THRESHOLD) - WEALTH_TAX_THRESHOLD)
  const highBand = Math.max(0, netWealth - Math.max(WEALTH_TAX_HIGH_THRESHOLD, WEALTH_TAX_THRESHOLD))
  return lowBand * (WEALTH_TAX_RATE / 100) + highBand * (WEALTH_TAX_HIGH_RATE / 100)
}

export function findBreakevenYear(yearlyData: YearlyDataPoint[]): number | null {
  for (let i = 1; i < yearlyData.length; i++) {
    const prev = yearlyData[i - 1]
    const curr = yearlyData[i]
    if (
      (prev.buyerNetWorth >= prev.renterNetWorth) !==
      (curr.buyerNetWorth >= curr.renterNetWorth)
    ) {
      return curr.year
    }
  }
  return null
}

function emptyBuyerCosts(): BuyerCostBreakdown {
  return {
    mortgage: 0, hoaFee: 0, utilities: 0, maintenance: 0, municipalFees: 0,
    insurance: 0, propertyTax: 0, interestDeduction: 0, total: 0,
  }
}

function averageOverYear<T extends object>(sums: T): T {
  const out = { ...sums }
  for (const key of Object.keys(out) as (keyof T)[]) {
    (out[key] as number) = (out[key] as number) / 12
  }
  return out
}

interface SummaryExtras {
  totalBuyerPaid: number
  totalRenterPaid: number
  finalRenterNominalGross: number
  finalAskTax: number
  finalBuyerPortfolioGross: number
  finalBuyerAskTax: number
  year1BuyerCosts: BuyerCostBreakdown
  year1RenterCosts: RenterCostBreakdown
}

function buildSummary(
  p: SimParams,
  inputs: Inputs,
  yearlyData: YearlyDataPoint[],
  extras: SummaryExtras,
): Summary {
  const finalYear = yearlyData[yearlyData.length - 1]
  const initialMonthlyMortgage = p.ioYears > 0 ? p.loanAmount * p.monthlyRate : p.monthlyAmortizingPayment

  return {
    monthlyMortgagePayment: initialMonthlyMortgage,
    monthlyAmortizingPayment: p.monthlyAmortizingPayment,
    downPayment: p.downPayment,
    closingCosts: p.closingCosts,
    initialInvestment: p.initialInvestment,
    securityDeposit: p.securityDeposit,
    year1BuyerCosts: extras.year1BuyerCosts,
    year1RenterCosts: extras.year1RenterCosts,
    totalBuyerPaid: extras.totalBuyerPaid,
    totalRenterPaid: extras.totalRenterPaid,
    finalHomeValue: finalYear.homeValue,
    finalEquity: finalYear.buyerNetWorth,
    finalRenterPortfolio: finalYear.renterNetWorth,
    finalRenterNominalGross: extras.finalRenterNominalGross,
    finalAskTax: extras.finalAskTax,
    finalBuyerPortfolioGross: extras.finalBuyerPortfolioGross,
    finalBuyerAskTax: extras.finalBuyerAskTax,
    finalRemainingMortgage: finalYear.remainingMortgage,
    initialMonthlyRent: inputs.monthlyRent,
    initialBuyerMonthly: yearlyData[0].buyerMonthlyCost,
    loanAmount: p.loanAmount,
    monthlyRate: p.monthlyRate,
    numPayments: p.numPayments,
    ioYears: p.ioYears,
    remainingTermMonths: p.remainingTermMonths,
    finalInflationFactor: Math.pow(1 + inputs.inflation / 100, inputs.years),
  }
}

export function calculate(rawInputs: Inputs, mode: Mode): CalculationResult {
  const inputs = normalizeInputs(rawInputs)
  const isAdvanced = mode === 'advanced'
  const p = computeSimParams(inputs, isAdvanced)

  const buyer = newHoldings(p.savingsInitial, p.askInitial)
  const renter = newHoldings(p.savingsInitial, p.askInitial)
  invest(renter, p.initialInvestment, isAdvanced)
  withdraw(renter, p.securityDeposit)

  let remainingMortgage = p.loanAmount
  let currentMonthlyRent = inputs.monthlyRent
  let currentHoaFee = inputs.monthlyHoaFee
  let totalBuyerPaid = 0
  let totalRenterPaid = 0
  let lastRenterNominalGross = 0
  let lastAskTax = 0
  let lastBuyerPortfolioGross = 0
  let lastBuyerAskTax = 0
  const year1Buyer = emptyBuyerCosts()
  const year1Renter: RenterCostBreakdown = { rent: 0, extras: 0, bsuDeduction: 0, total: 0 }

  const yearlyData: YearlyDataPoint[] = []

  for (let year = 1; year <= inputs.years; year++) {
    let yearlyBuyerCashflow = 0
    let yearlyRenterCashflow = 0

    if (isAdvanced && inputs.askShieldingRate > 0) {
      for (const h of [buyer, renter]) {
        h.askShielding += (h.askCostBasis + h.askShielding) * (inputs.askShieldingRate / 100)
      }
    }

    const isInterestOnly = p.ioYears > 0 && year <= p.ioYears
    const inflationMultiplier = Math.pow(1 + inputs.inflation / 100, year - 1)
    const maintenanceMonthly = isAdvanced
      ? (inputs.purchasePrice * inputs.renovationPct / 100 / 12) * inflationMultiplier
      : 0
    const municipalFeesMonthly = p.municipalFeesBase * inflationMultiplier

    for (let month = 0; month < 12; month++) {
      const { effectiveMortgage, principalPayment, interestPayment } =
        computeMonthlyMortgage(remainingMortgage, p.monthlyRate, p.monthlyAmortizingPayment, isInterestOnly)

      const taxDeductionMonthly = (interestPayment + p.sharedDebtMonthlyInterest) * INTEREST_DEDUCTION
      const advancedBuyerMonthly = isAdvanced
        ? maintenanceMonthly + municipalFeesMonthly + p.insuranceMonthly + p.propertyTaxMonthly
        : 0

      const buyerMonthlyCost =
        effectiveMortgage + currentHoaFee + p.sharedUtilitiesMonthly + advancedBuyerMonthly - taxDeductionMonthly
      const renterMonthlyCost = currentMonthlyRent + p.advancedRentMonthly - p.bsuMonthlySaving
      const monthlyDiff = buyerMonthlyCost - renterMonthlyCost

      if (year === 1) {
        year1Buyer.mortgage += effectiveMortgage
        year1Buyer.hoaFee += currentHoaFee
        year1Buyer.utilities += p.sharedUtilitiesMonthly
        if (isAdvanced) {
          year1Buyer.maintenance += maintenanceMonthly
          year1Buyer.municipalFees += municipalFeesMonthly
          year1Buyer.insurance += p.insuranceMonthly
          year1Buyer.propertyTax += p.propertyTaxMonthly
        }
        year1Buyer.interestDeduction += taxDeductionMonthly
        year1Buyer.total += buyerMonthlyCost
        year1Renter.rent += currentMonthlyRent
        year1Renter.extras += p.advancedRentMonthly
        year1Renter.bsuDeduction += p.bsuMonthlySaving
        year1Renter.total += renterMonthlyCost
      }

      for (const h of [buyer, renter]) {
        h.savings *= 1 + p.cashMonthlyReturn
        h.ask *= 1 + p.askMonthlyReturn
      }
      if (monthlyDiff >= 0) invest(renter, monthlyDiff, isAdvanced)
      else invest(buyer, -monthlyDiff, isAdvanced)

      remainingMortgage = Math.max(0, remainingMortgage - principalPayment)

      yearlyBuyerCashflow += buyerMonthlyCost
      yearlyRenterCashflow += renterMonthlyCost
    }

    const homeValue = p.effectivePrice * Math.pow(1 + inputs.appreciationRate / 100, year)

    if (isAdvanced) {
      const { buyerWealthTax, renterWealthTax } = computeAnnualWealthTax(
        homeValue, remainingMortgage, inputs.sharedDebt,
        buyer,
        { savings: renter.savings + p.securityDeposit, ask: renter.ask },
      )
      withdraw(buyer, buyerWealthTax)
      withdraw(renter, renterWealthTax)
      totalBuyerPaid += buyerWealthTax
      totalRenterPaid += renterWealthTax
    }

    totalBuyerPaid += yearlyBuyerCashflow
    totalRenterPaid += yearlyRenterCashflow

    const inflationFactor = Math.pow(1 + inputs.inflation / 100, year)

    lastBuyerPortfolioGross = buyer.savings + buyer.ask
    lastBuyerAskTax = askTaxOnExit(buyer)
    const buyerPortfolio = lastBuyerPortfolioGross - lastBuyerAskTax
    const buyerEquity = homeValue - remainingMortgage - inputs.sharedDebt - inputs.brokerSellingFee + buyerPortfolio

    lastRenterNominalGross = renter.savings + renter.ask + p.securityDeposit
    lastAskTax = askTaxOnExit(renter)

    yearlyData.push({
      year,
      buyerMonthlyCost: yearlyBuyerCashflow / 12,
      renterMonthlyCost: yearlyRenterCashflow / 12,
      buyerNetWorth: buyerEquity / inflationFactor,
      renterNetWorth: (lastRenterNominalGross - lastAskTax) / inflationFactor,
      homeValue,
      remainingMortgage,
      buyerPortfolio,
    })

    currentMonthlyRent *= 1 + inputs.rentIncrease / 100
    currentHoaFee *= 1 + (isAdvanced ? inputs.hoaFeeIncrease : DEFAULT_HOA_INCREASE_PCT) / 100
  }

  const finalYear = yearlyData[yearlyData.length - 1]
  const recommendation = finalYear.buyerNetWorth >= finalYear.renterNetWorth ? 'buy' : 'rent'
  const difference = Math.abs(finalYear.buyerNetWorth - finalYear.renterNetWorth)

  return {
    yearlyData,
    recommendation,
    difference,
    breakevenYear: findBreakevenYear(yearlyData),
    summary: buildSummary(p, inputs, yearlyData, {
      totalBuyerPaid,
      totalRenterPaid,
      finalRenterNominalGross: lastRenterNominalGross,
      finalAskTax: lastAskTax,
      finalBuyerPortfolioGross: lastBuyerPortfolioGross,
      finalBuyerAskTax: lastBuyerAskTax,
      year1BuyerCosts: averageOverYear(year1Buyer),
      year1RenterCosts: averageOverYear(year1Renter),
    }),
  }
}
