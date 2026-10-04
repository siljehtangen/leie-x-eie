import type {
  Inputs,
  Mode,
  NumericInputKey,
  CalculationResult,
  YearlyDataPoint,
  Summary,
  BuyerCostBreakdown,
  RenterCostBreakdown,
  RateChange,
  StressTest,
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
  SECURITY_DEPOSIT_MONTHS,
  BSU_TAX_DEDUCTION_RATE,
  BSU_MAX_CONTRIBUTION,
  STAMP_DUTY_RATE,
  STRESS_TEST_RATE_ADD_PCT,
  STRESS_TEST_MIN_RATE_PCT,
} from '../constants/finance'
import { INPUT_BOUNDS, INTEGER_INPUT_KEYS, MODEL_BOUNDS, type NumericBound } from '../constants/inputBounds'

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
  rateChangeYear: number
  rateAfterChangePct: number
  initialInvestment: number
  securityDeposit: number
  savingsInitial: number
  askInitial: number
  cashMonthlyReturn: number
  askMonthlyReturn: number
  bsuMonthlySaving: number
  bsuMonthlyContribution: number
  livingCostsMonthly: number
  municipalFeesBase: number
  insuranceMonthly: number
  propertyTaxMonthly: number
  sharedDebt: number
  sharedDebtMonthlyRate: number
  sharedDebtPayment: number
  isCouple: boolean
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

function boundFor(key: NumericInputKey, inputs: Inputs, table: Record<NumericInputKey, NumericBound>): NumericBound {
  if (key === 'bsuYearlyContribution') {
    return { min: 0, max: BSU_MAX_CONTRIBUTION * (inputs.isCouple ? 2 : 1) }
  }
  return table[key]
}

function applyBounds(inputs: Inputs, table: Record<NumericInputKey, NumericBound>): Inputs {
  const next = { ...inputs }
  for (const key of Object.keys(next) as (keyof Inputs)[]) {
    const value = next[key]
    if (typeof value === 'number') {
      ;(next as Record<keyof Inputs, number | boolean>)[key] = finiteOr(value, 0)
    }
  }
  const integers = new Set<string>(INTEGER_INPUT_KEYS)
  for (const key of Object.keys(table) as NumericInputKey[]) {
    const value = integers.has(key) ? Math.round(next[key]) : next[key]
    const { min, max } = boundFor(key, next, table)
    next[key] = Math.min(max, Math.max(min, value))
  }
  return next
}

// Safety net for every caller, including the sensitivity grid and breakeven search.
export function normalizeInputs(inputs: Inputs): Inputs {
  return applyBounds(inputs, MODEL_BOUNDS)
}

// Form limits. Anything a person entered, saved, or shared goes through this.
export function clampInputs(inputs: Inputs): Inputs {
  return applyBounds(inputs, INPUT_BOUNDS)
}

function monthlyFromAnnual(annualPct: number): number {
  return Math.pow(Math.max(0, 1 + annualPct / 100), 1 / 12) - 1
}

export function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0
  if (monthlyRate <= 0) return principal / months
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

// Clears floating-point residue below one øre so repaid loans read as exactly zero.
function settle(balance: number): number {
  return balance < 0.01 ? 0 : balance
}

function effectiveSharedDebt(inputs: Inputs, isAdvanced: boolean): number {
  return isAdvanced && inputs.isBorettslag ? inputs.sharedDebt : 0
}

// Quick mode is a freehold comparison. A cooperative exemption stored on the
// inputs (stamp duty set to 0) must not follow the user into quick mode.
export function stampDutyForMode(inputs: Inputs, mode: Mode): number {
  if (mode === 'advanced' || !inputs.isBorettslag || inputs.stampDuty !== 0) return inputs.stampDuty
  return Math.round(Math.max(0, inputs.purchasePrice) * STAMP_DUTY_RATE)
}

function computeSimParams(inputs: Inputs, isAdvanced: boolean): SimParams {
  const {
    purchasePrice,
    downPayment,
    mortgageRate,
    loanTermYears,
    otherClosingCosts,
    interestOnlyYears,
    monthlyRent,
    investmentReturn,
    savingsAccountBalance,
    askBalance,
    savingsAccountRate,
    askRate,
    bsuActive,
    bsuYearlyContribution,
    contentsInsurance,
    electricity,
    internet,
    parking,
    municipalFees,
    homeInsurance,
    propertyTax,
    sharedDebtRate,
    sharedDebtTermYears,
  } = inputs

  const loanAmount = Math.max(0, purchasePrice - downPayment)
  const closingCosts =
    stampDutyForMode(inputs, isAdvanced ? 'advanced' : 'quick') + (isAdvanced ? otherClosingCosts : 0)
  const bsuCap = BSU_MAX_CONTRIBUTION * (inputs.isCouple ? 2 : 1)
  const bsuYearly = isAdvanced && bsuActive ? Math.min(bsuYearlyContribution, bsuCap) : 0
  const monthlyRate = mortgageRate / 100 / 12
  const ioYears = isAdvanced ? Math.min(interestOnlyYears, loanTermYears - 1) : 0
  const numPayments = loanTermYears * 12
  const remainingTermMonths = numPayments - ioYears * 12
  const securityDeposit = isAdvanced ? monthlyRent * SECURITY_DEPOSIT_MONTHS : 0
  const sharedDebt = effectiveSharedDebt(inputs, isAdvanced)
  const sharedDebtMonthlyRate = sharedDebtRate / 100 / 12

  return {
    effectivePrice: purchasePrice + sharedDebt,
    downPayment,
    loanAmount,
    closingCosts,
    monthlyRate,
    ioYears,
    numPayments,
    remainingTermMonths,
    monthlyAmortizingPayment: annuityPayment(loanAmount, monthlyRate, remainingTermMonths),
    rateChangeYear: isAdvanced ? inputs.mortgageRateChangeYear : 0,
    rateAfterChangePct: inputs.mortgageRateAfterChange,
    initialInvestment: downPayment + closingCosts,
    securityDeposit,
    savingsInitial: isAdvanced ? savingsAccountBalance : 0,
    askInitial: isAdvanced ? askBalance : 0,
    cashMonthlyReturn: monthlyFromAnnual((isAdvanced ? savingsAccountRate : investmentReturn) * (1 - SAVINGS_TAX_RATE)),
    askMonthlyReturn: monthlyFromAnnual(askRate),
    bsuMonthlySaving: (bsuYearly * BSU_TAX_DEDUCTION_RATE) / 12,
    bsuMonthlyContribution: bsuYearly / 12,
    livingCostsMonthly: isAdvanced ? (contentsInsurance + electricity + internet + parking * 12) / 12 : 0,
    municipalFeesBase: isAdvanced ? municipalFees / 12 : 0,
    insuranceMonthly: isAdvanced ? homeInsurance / 12 : 0,
    propertyTaxMonthly: isAdvanced ? propertyTax / 12 : 0,
    sharedDebt,
    sharedDebtMonthlyRate,
    sharedDebtPayment: annuityPayment(sharedDebt, sharedDebtMonthlyRate, sharedDebtTermYears * 12),
    isCouple: isAdvanced && inputs.isCouple,
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

export function stressTestRate(ratePct: number): number {
  return Math.max(ratePct + STRESS_TEST_RATE_ADD_PCT, STRESS_TEST_MIN_RATE_PCT)
}

export function computeStressTest(rawInputs: Inputs, mode: Mode): StressTest {
  const inputs = normalizeInputs(rawInputs)
  const loanAmount = Math.max(0, inputs.purchasePrice - inputs.downPayment)
  const months = inputs.loanTermYears * 12
  const ratePct = stressTestRate(inputs.mortgageRate)
  const normalPayment = annuityPayment(loanAmount, inputs.mortgageRate / 100 / 12, months)
  const stressedPayment = annuityPayment(loanAmount, ratePct / 100 / 12, months)

  const sharedDebt = effectiveSharedDebt(inputs, mode === 'advanced')
  const sharedDebtExtra = (sharedDebt * (stressTestRate(inputs.sharedDebtRate) - inputs.sharedDebtRate)) / 100 / 12
  // Other debt has no rate of its own, so it is priced as interest-only at the stress rate.
  const otherDebtMonthly = ((mode === 'advanced' ? inputs.otherDebt : 0) * (ratePct / 100)) / 12
  const debtPayment = stressedPayment + sharedDebtExtra + otherDebtMonthly

  return {
    ratePct,
    monthlyPayment: stressedPayment,
    extraPerMonth: debtPayment - normalPayment,
    debtPayment,
  }
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
  isCouple = false,
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
    buyerWealthTax: wealthTaxOn(buyerTaxableWealth, isCouple),
    renterWealthTax: wealthTaxOn(renterTaxableWealth, isCouple),
  }
}

export function wealthTaxOn(netWealth: number, isCouple = false): number {
  const factor = isCouple ? 2 : 1
  const threshold = WEALTH_TAX_THRESHOLD * factor
  const highThreshold = WEALTH_TAX_HIGH_THRESHOLD * factor
  const lowBand = Math.max(0, Math.min(netWealth, highThreshold) - threshold)
  const highBand = Math.max(0, netWealth - Math.max(highThreshold, threshold))
  return lowBand * (WEALTH_TAX_RATE / 100) + highBand * (WEALTH_TAX_HIGH_RATE / 100)
}

export function findBreakevenYear(yearlyData: YearlyDataPoint[]): number | null {
  for (let i = 1; i < yearlyData.length; i++) {
    const prev = yearlyData[i - 1]
    const curr = yearlyData[i]
    if (prev.buyerNetWorth >= prev.renterNetWorth !== curr.buyerNetWorth >= curr.renterNetWorth) {
      return curr.year
    }
  }
  return null
}

function emptyBuyerCosts(): BuyerCostBreakdown {
  return {
    mortgage: 0,
    hoaFee: 0,
    utilities: 0,
    maintenance: 0,
    municipalFees: 0,
    insurance: 0,
    propertyTax: 0,
    interestDeduction: 0,
    rentalIncome: 0,
    total: 0,
  }
}

function averageOverYear<T extends object>(sums: T): T {
  const out = { ...sums }
  for (const key of Object.keys(out) as (keyof T)[]) {
    ;(out[key] as number) = (out[key] as number) / 12
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
  finalBrokerFee: number
  year1BuyerCosts: BuyerCostBreakdown
  year1RenterCosts: RenterCostBreakdown
  rateChange: RateChange | null
  stressTest: StressTest
}

function buildSummary(p: SimParams, inputs: Inputs, yearlyData: YearlyDataPoint[], extras: SummaryExtras): Summary {
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
    finalBrokerFee: extras.finalBrokerFee,
    initialMonthlyRent: inputs.monthlyRent,
    initialBuyerMonthly: yearlyData[0].buyerMonthlyCost,
    loanAmount: p.loanAmount,
    monthlyRate: p.monthlyRate,
    numPayments: p.numPayments,
    ioYears: p.ioYears,
    remainingTermMonths: p.remainingTermMonths,
    finalInflationFactor: Math.pow(1 + inputs.inflation / 100, inputs.years),
    finalSharedDebt: finalYear.remainingSharedDebt,
    rateChange: extras.rateChange,
    stressTest: extras.stressTest,
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
  let remainingSharedDebt = p.sharedDebt
  let depositBalance = p.securityDeposit
  let bsuBalance = 0
  let currentMonthlyRent = inputs.monthlyRent
  let currentHoaFee = inputs.monthlyHoaFee
  let currentRentalIncome = isAdvanced ? inputs.rentalIncome : 0
  let lastBrokerFee = inputs.brokerSellingFee
  let totalBuyerPaid = 0
  let totalRenterPaid = 0
  let lastRenterNominalGross = 0
  let lastAskTax = 0
  let lastBuyerPortfolioGross = 0
  let lastBuyerAskTax = 0
  let rateChange: RateChange | null = null
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
    const ratePct = p.rateChangeYear > 0 && year >= p.rateChangeYear ? p.rateAfterChangePct : inputs.mortgageRate
    const monthlyRate = ratePct / 100 / 12
    const monthlyPayment = isInterestOnly
      ? 0
      : annuityPayment(remainingMortgage, monthlyRate, p.numPayments - (year - 1) * 12)
    if (year === p.rateChangeYear) {
      rateChange = {
        year,
        ratePct,
        monthlyPayment: isInterestOnly ? remainingMortgage * monthlyRate : monthlyPayment,
      }
    }

    const inflationMultiplier = Math.pow(1 + inputs.inflation / 100, year - 1)
    const maintenanceMonthly = isAdvanced
      ? ((inputs.purchasePrice * inputs.renovationPct) / 100 / 12) * inflationMultiplier
      : 0
    const municipalFeesMonthly = p.municipalFeesBase * inflationMultiplier

    for (let month = 0; month < 12; month++) {
      const { effectiveMortgage, principalPayment, interestPayment } = computeMonthlyMortgage(
        remainingMortgage,
        monthlyRate,
        monthlyPayment,
        isInterestOnly,
      )

      const sharedDebtInterest = remainingSharedDebt * p.sharedDebtMonthlyRate
      const sharedDebtPrincipal = Math.max(0, Math.min(p.sharedDebtPayment - sharedDebtInterest, remainingSharedDebt))

      const taxDeductionMonthly = (interestPayment + sharedDebtInterest) * INTEREST_DEDUCTION
      const advancedBuyerMonthly = isAdvanced
        ? maintenanceMonthly + municipalFeesMonthly + p.insuranceMonthly + p.propertyTaxMonthly
        : 0

      const buyerMonthlyCost =
        effectiveMortgage +
        currentHoaFee +
        p.livingCostsMonthly +
        advancedBuyerMonthly -
        taxDeductionMonthly -
        currentRentalIncome
      const renterMonthlyCost = currentMonthlyRent + p.livingCostsMonthly - p.bsuMonthlySaving
      const monthlyDiff = buyerMonthlyCost - renterMonthlyCost

      if (year === 1) {
        year1Buyer.mortgage += effectiveMortgage
        year1Buyer.hoaFee += currentHoaFee
        year1Buyer.utilities += p.livingCostsMonthly
        if (isAdvanced) {
          year1Buyer.maintenance += maintenanceMonthly
          year1Buyer.municipalFees += municipalFeesMonthly
          year1Buyer.insurance += p.insuranceMonthly
          year1Buyer.propertyTax += p.propertyTaxMonthly
        }
        year1Buyer.interestDeduction += taxDeductionMonthly
        year1Buyer.rentalIncome += currentRentalIncome
        year1Buyer.total += buyerMonthlyCost
        year1Renter.rent += currentMonthlyRent
        year1Renter.extras += p.livingCostsMonthly
        year1Renter.bsuDeduction += p.bsuMonthlySaving
        year1Renter.total += renterMonthlyCost
      }

      for (const h of [buyer, renter]) {
        h.savings *= 1 + p.cashMonthlyReturn
        h.ask *= 1 + p.askMonthlyReturn
      }
      depositBalance *= 1 + p.cashMonthlyReturn
      bsuBalance *= 1 + p.cashMonthlyReturn
      if (monthlyDiff >= 0) invest(renter, monthlyDiff, isAdvanced)
      else invest(buyer, -monthlyDiff, isAdvanced)
      if (p.bsuMonthlyContribution > 0) {
        withdraw(renter, p.bsuMonthlyContribution)
        bsuBalance += p.bsuMonthlyContribution
      }

      remainingMortgage = settle(remainingMortgage - principalPayment)
      remainingSharedDebt = settle(remainingSharedDebt - sharedDebtPrincipal)

      yearlyBuyerCashflow += buyerMonthlyCost
      yearlyRenterCashflow += renterMonthlyCost
    }

    const priceGrowth = Math.pow(1 + inputs.appreciationRate / 100, year)
    const homeValue = p.effectivePrice * priceGrowth
    // Broker fees are priced off the sale price, so they track the home's value rather than staying fixed.
    lastBrokerFee = inputs.brokerSellingFee * priceGrowth

    if (isAdvanced) {
      const { buyerWealthTax, renterWealthTax } = computeAnnualWealthTax(
        homeValue,
        remainingMortgage,
        remainingSharedDebt,
        buyer,
        { savings: renter.savings + depositBalance + bsuBalance, ask: renter.ask },
        p.isCouple,
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
    const buyerEquity = homeValue - remainingMortgage - remainingSharedDebt - lastBrokerFee + buyerPortfolio

    lastRenterNominalGross = renter.savings + renter.ask + depositBalance + bsuBalance
    lastAskTax = askTaxOnExit(renter)

    yearlyData.push({
      year,
      buyerMonthlyCost: yearlyBuyerCashflow / 12,
      renterMonthlyCost: yearlyRenterCashflow / 12,
      buyerNetWorth: buyerEquity / inflationFactor,
      renterNetWorth: (lastRenterNominalGross - lastAskTax) / inflationFactor,
      homeValue,
      remainingMortgage,
      remainingSharedDebt,
      buyerPortfolio,
    })

    currentMonthlyRent *= 1 + inputs.rentIncrease / 100
    currentRentalIncome *= 1 + inputs.rentIncrease / 100
    currentHoaFee *= 1 + inputs.hoaFeeIncrease / 100
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
      finalBrokerFee: lastBrokerFee,
      year1BuyerCosts: averageOverYear(year1Buyer),
      year1RenterCosts: averageOverYear(year1Renter),
      rateChange,
      stressTest: computeStressTest(inputs, mode),
    }),
  }
}
