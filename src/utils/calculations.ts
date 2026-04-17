import type { Inputs, Mode, CalculationResult, YearlyDataPoint, Summary } from '../types'
import {
  WEALTH_TAX_THRESHOLD,
  WEALTH_TAX_RATE,
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
  quickMonthlyReturn: number
  savingsInitial: number
  askInitial: number
  savingsMonthlyReturn: number
  askMonthlyReturn: number
  bsuMonthlySaving: number
  advancedRentMonthly: number
  sharedUtilitiesMonthly: number
  municipalFeesBase: number
  insuranceMonthly: number
  propertyTaxMonthly: number
  sharedDebtMonthlyInterest: number
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
    quickMonthlyReturn: investmentReturn / 100 / 12 * (1 - QUICK_INVESTMENT_TAX),
    savingsInitial: isAdvanced ? Math.max(0, savingsAccountBalance - securityDeposit) : 0,
    askInitial: isAdvanced ? Math.max(0, askBalance) : 0,
    savingsMonthlyReturn: savingsAccountRate / 100 / 12 * (1 - SAVINGS_TAX_RATE),
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
  return { effectiveMortgage: monthlyAmortizingPayment, principalPayment, interestPayment }
}

function computeAnnualWealthTax(
  homeValue: number,
  remainingMortgage: number,
  sharedDebt: number,
  savingsPortfolio: number,
  askPortfolio: number,
): { buyerWealthTax: number; renterWealthTax: number } {
  const homeValueForWealthTax =
    Math.min(homeValue, PRIMARY_RESIDENCE_HIGH_THRESHOLD) * PRIMARY_RESIDENCE_VALUATION +
    Math.max(0, homeValue - PRIMARY_RESIDENCE_HIGH_THRESHOLD) * PRIMARY_RESIDENCE_HIGH_VALUATION

  const buyerTaxableWealth = Math.max(0, homeValueForWealthTax - remainingMortgage - sharedDebt)
  const buyerWealthTax = Math.max(0, buyerTaxableWealth - WEALTH_TAX_THRESHOLD) * (WEALTH_TAX_RATE / 100)

  const renterTaxableWealth = Math.max(
    0,
    savingsPortfolio * SAVINGS_VALUATION + askPortfolio * FINANCIAL_ASSET_VALUATION,
  )
  const renterWealthTax = Math.max(0, renterTaxableWealth - WEALTH_TAX_THRESHOLD) * (WEALTH_TAX_RATE / 100)

  return { buyerWealthTax, renterWealthTax }
}

function findBreakevenYear(yearlyData: YearlyDataPoint[]): number | null {
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

function buildSummary(
  p: SimParams,
  yearlyData: YearlyDataPoint[],
  totalBuyerPaid: number,
  totalRenterPaid: number,
  finalRenterNominalGross: number,
  finalAskTax: number,
  inflation: number,
  years: number,
  initialMonthlyRent: number,
): Summary {
  const finalYear = yearlyData[yearlyData.length - 1]
  const initialMonthlyMortgage = p.ioYears > 0 ? p.loanAmount * p.monthlyRate : p.monthlyAmortizingPayment

  return {
    monthlyMortgagePayment: initialMonthlyMortgage,
    monthlyAmortizingPayment: p.monthlyAmortizingPayment,
    downPayment: p.downPayment,
    closingCosts: p.closingCosts,
    totalBuyerPaid,
    totalRenterPaid,
    finalHomeValue: finalYear.homeValue,
    finalEquity: finalYear.buyerNetWorth,
    finalRenterPortfolio: finalYear.renterNetWorth,
    finalRenterNominalGross,
    finalAskTax,
    finalRemainingMortgage: finalYear.remainingMortgage,
    initialMonthlyRent,
    initialBuyerMonthly: yearlyData[0].buyerMonthlyCost,
    loanAmount: p.loanAmount,
    monthlyRate: p.monthlyRate,
    numPayments: p.numPayments,
    ioYears: p.ioYears,
    remainingTermMonths: p.remainingTermMonths,
    finalInflationFactor: Math.pow(1 + inflation / 100, years),
  }
}

export function calculate(inputs: Inputs, mode: Mode): CalculationResult {
  const isAdvanced = mode === 'advanced'
  const p = computeSimParams(inputs, isAdvanced)

  let renterPortfolio = p.initialInvestment
  let savingsPortfolio = p.savingsInitial
  let askPortfolio = p.askInitial
  let askCostBasis = p.askInitial
  let accumulatedShielding = 0
  let remainingMortgage = p.loanAmount
  let cumulativeBuyerWealthTax = 0
  let currentMonthlyRent = inputs.monthlyRent
  let currentHoaFee = inputs.monthlyHoaFee
  let totalBuyerPaid = 0
  let totalRenterPaid = 0
  let lastRenterNominalGross = 0
  let lastAskTax = 0

  const yearlyData: YearlyDataPoint[] = []

  for (let year = 1; year <= inputs.years; year++) {
    let yearlyBuyerCashflow = 0
    let yearlyRenterCashflow = 0

    if (isAdvanced && inputs.askShieldingRate > 0) {
      accumulatedShielding += (askCostBasis + accumulatedShielding) * (inputs.askShieldingRate / 100)
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

      const taxDeductionMonthly =
        (interestPayment + (isAdvanced ? p.sharedDebtMonthlyInterest : 0)) * INTEREST_DEDUCTION

      let buyerMonthlyCost = effectiveMortgage + currentHoaFee + p.sharedUtilitiesMonthly - taxDeductionMonthly
      if (isAdvanced) {
        buyerMonthlyCost += maintenanceMonthly + municipalFeesMonthly + p.insuranceMonthly + p.propertyTaxMonthly
      }

      const renterMonthlyCost = currentMonthlyRent + p.advancedRentMonthly - p.bsuMonthlySaving
      const monthlyDiff = buyerMonthlyCost - renterMonthlyCost

      if (isAdvanced) {
        savingsPortfolio *= (1 + p.savingsMonthlyReturn)
        askPortfolio *= (1 + p.askMonthlyReturn)
        if (monthlyDiff >= 0) {
          askPortfolio += monthlyDiff
          askCostBasis += monthlyDiff
        } else {
          const shortfall = -monthlyDiff
          const fromSavings = Math.min(shortfall, savingsPortfolio)
          savingsPortfolio -= fromSavings
          const fromAsk = shortfall - fromSavings
          askPortfolio = Math.max(0, askPortfolio - fromAsk)
          askCostBasis = Math.max(0, askCostBasis - fromAsk)
        }
      } else {
        renterPortfolio = renterPortfolio * (1 + p.quickMonthlyReturn) + monthlyDiff
      }

      if (remainingMortgage > 0) {
        remainingMortgage = Math.max(0, remainingMortgage - principalPayment)
      }

      yearlyBuyerCashflow += buyerMonthlyCost
      yearlyRenterCashflow += renterMonthlyCost
    }

    const homeValue = p.effectivePrice * Math.pow(1 + inputs.appreciationRate / 100, year)
    const isFinalYear = year === inputs.years
    const sellingCost = isFinalYear ? inputs.brokerSellingFee : 0

    if (isAdvanced) {
      const { buyerWealthTax, renterWealthTax } = computeAnnualWealthTax(
        homeValue, remainingMortgage, inputs.sharedDebt, savingsPortfolio, askPortfolio,
      )
      totalBuyerPaid += buyerWealthTax
      cumulativeBuyerWealthTax += buyerWealthTax

      const fromSavings = Math.min(renterWealthTax, savingsPortfolio)
      savingsPortfolio -= fromSavings
      const fromAsk = renterWealthTax - fromSavings
      if (fromAsk > 0) {
        askPortfolio -= fromAsk
        askCostBasis = Math.max(0, askCostBasis - fromAsk)
      }
    }

    totalBuyerPaid += yearlyBuyerCashflow
    totalRenterPaid += yearlyRenterCashflow

    const inflationFactor = Math.pow(1 + inputs.inflation / 100, year)
    const buyerEquity = homeValue - remainingMortgage - inputs.sharedDebt - sellingCost
      - (isAdvanced ? cumulativeBuyerWealthTax : 0)

    if (isFinalYear && isAdvanced && p.securityDeposit > 0) {
      savingsPortfolio += p.securityDeposit
    }

    let renterNetWorth: number
    if (isAdvanced) {
      const askGains = Math.max(0, askPortfolio - askCostBasis)
      const taxableAskGains = Math.max(0, askGains - accumulatedShielding)
      lastAskTax = taxableAskGains * ASK_TAX_RATE
      lastRenterNominalGross = savingsPortfolio + askPortfolio
      renterNetWorth = (lastRenterNominalGross - lastAskTax) / inflationFactor
    } else {
      lastAskTax = 0
      lastRenterNominalGross = renterPortfolio
      renterNetWorth = renterPortfolio / inflationFactor
    }

    yearlyData.push({
      year,
      buyerMonthlyCost: yearlyBuyerCashflow / 12,
      renterMonthlyCost: yearlyRenterCashflow / 12,
      buyerNetWorth: buyerEquity / inflationFactor,
      renterNetWorth,
      homeValue,
      remainingMortgage,
      cumulativeBuyerWealthTax,
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
    summary: buildSummary(
      p, yearlyData, totalBuyerPaid, totalRenterPaid,
      lastRenterNominalGross, lastAskTax, inputs.inflation, inputs.years, inputs.monthlyRent,
    ),
  }
}

export { getLocale, formatInputNum, formatNOK, formatChartNOK } from './formatting'
