import type { Inputs, Mode, CalculationResult, YearlyDataPoint } from '../types'
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
} from '../constants/finance'

export function calculate(inputs: Inputs, mode: Mode): CalculationResult {
  const {
    monthlyRent,
    rentIncrease,
    purchasePrice,
    downPayment,
    mortgageRate,
    loanTermYears,
    monthlyHoaFee,
    stampDuty,
    brokerSellingFee,
    years,
    appreciationRate,
    investmentReturn,
    inflation,
    contentsInsurance,
    electricity,
    internet,
    parking,
    otherClosingCosts,
    sharedDebt,
    municipalFees,
    renovationPct,
    homeInsurance,
    propertyTax,
    hoaFeeIncrease,
    sharedDebtRate,
    interestOnlyYears,
    savingsAccountBalance,
    savingsAccountRate,
    askBalance,
    askRate,
    askShieldingRate,
    bsuActive,
    bsuYearlyContribution,
  } = inputs

  const isAdvanced = mode === 'advanced'

  const effectivePrice = purchasePrice + sharedDebt
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

  const initialInvestment = downPayment + closingCosts
  const securityDeposit = isAdvanced ? monthlyRent * SECURITY_DEPOSIT_MONTHS : 0

  const quickMonthlyReturn = investmentReturn / 100 / 12 * (1 - QUICK_INVESTMENT_TAX)

  // In advanced mode, security deposit is locked cash — deduct from savings first
  const savingsInitial = isAdvanced ? Math.max(0, savingsAccountBalance - securityDeposit) : 0
  const askInitial = isAdvanced ? Math.max(0, askBalance) : 0

  const savingsMonthlyReturn = savingsAccountRate / 100 / 12 * (1 - SAVINGS_TAX_RATE)
  const askMonthlyReturn = askRate / 100 / 12

  const bsuMonthlySaving = isAdvanced && bsuActive ? (bsuYearlyContribution * BSU_TAX_DEDUCTION_RATE) / 12 : 0

  let renterPortfolio = initialInvestment
  let savingsPortfolio = savingsInitial
  let askPortfolio = askInitial
  let askCostBasis = askInitial
  let accumulatedShielding = 0

  let remainingMortgage = loanAmount
  let cumulativeBuyerWealthTax = 0
  let currentMonthlyRent = monthlyRent
  let currentHoaFee = monthlyHoaFee

  const advancedRentMonthly = isAdvanced
    ? (contentsInsurance + electricity + internet + parking * 12) / 12
    : 0

  const sharedUtilitiesMonthly = isAdvanced ? (electricity + internet) / 12 : 0
  const municipalFeesBase = isAdvanced ? municipalFees / 12 : 0
  const insuranceMonthly = isAdvanced ? homeInsurance / 12 : 0
  const propertyTaxMonthly = isAdvanced ? propertyTax / 12 : 0
  const sharedDebtMonthlyInterest = isAdvanced
    ? sharedDebt * (sharedDebtRate / 100) / 12
    : 0

  const yearlyData: YearlyDataPoint[] = []
  let totalBuyerPaid = 0
  let totalRenterPaid = 0
  let lastRenterNominalGross = 0
  let lastAskTax = 0

  for (let year = 1; year <= years; year++) {
    let yearlyBuyerCashflow = 0
    let yearlyRenterCashflow = 0

    if (isAdvanced && askShieldingRate > 0) {
      accumulatedShielding += (askCostBasis + accumulatedShielding) * (askShieldingRate / 100)
    }

    const isInterestOnly = ioYears > 0 && year <= ioYears
    const inflationMultiplier = Math.pow(1 + inflation / 100, year - 1)
    const maintenanceMonthly = isAdvanced
      ? (purchasePrice * renovationPct / 100 / 12) * inflationMultiplier
      : 0
    const municipalFeesMonthly = municipalFeesBase * inflationMultiplier

    for (let month = 0; month < 12; month++) {
      const interestPayment = remainingMortgage > 0 ? remainingMortgage * monthlyRate : 0

      let effectiveMortgage: number
      let principalPayment: number

      if (remainingMortgage <= 0) {
        effectiveMortgage = 0
        principalPayment = 0
      } else if (isInterestOnly) {
        effectiveMortgage = interestPayment
        principalPayment = 0
      } else {
        effectiveMortgage = monthlyAmortizingPayment
        principalPayment = Math.min(effectiveMortgage - interestPayment, remainingMortgage)
      }

      const taxDeductionMonthly =
        (interestPayment + (isAdvanced ? sharedDebtMonthlyInterest : 0)) * INTEREST_DEDUCTION

      let buyerMonthlyCost = effectiveMortgage + currentHoaFee + sharedUtilitiesMonthly - taxDeductionMonthly

      if (isAdvanced) {
        buyerMonthlyCost +=
          maintenanceMonthly +
          municipalFeesMonthly +
          insuranceMonthly +
          propertyTaxMonthly
      }

      const renterMonthlyCost = currentMonthlyRent + advancedRentMonthly - bsuMonthlySaving
      const monthlyDiff = buyerMonthlyCost - renterMonthlyCost

      if (isAdvanced) {
        savingsPortfolio *= (1 + savingsMonthlyReturn)
        askPortfolio *= (1 + askMonthlyReturn)
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
        renterPortfolio = renterPortfolio * (1 + quickMonthlyReturn) + monthlyDiff
      }

      if (remainingMortgage > 0) {
        remainingMortgage = Math.max(0, remainingMortgage - principalPayment)
      }

      yearlyBuyerCashflow += buyerMonthlyCost
      yearlyRenterCashflow += renterMonthlyCost
    }

    const homeValue = effectivePrice * Math.pow(1 + appreciationRate / 100, year)
    const isFinalYear = year === years
    const sellingCost = isFinalYear ? brokerSellingFee : 0

    if (isAdvanced) {
      const homeValueForWealthTax =
        Math.min(homeValue, PRIMARY_RESIDENCE_HIGH_THRESHOLD) * PRIMARY_RESIDENCE_VALUATION +
        Math.max(0, homeValue - PRIMARY_RESIDENCE_HIGH_THRESHOLD) * PRIMARY_RESIDENCE_HIGH_VALUATION
      const buyerTaxableWealth = Math.max(
        0,
        homeValueForWealthTax - remainingMortgage - sharedDebt,
      )
      const buyerWealthTax =
        Math.max(0, buyerTaxableWealth - WEALTH_TAX_THRESHOLD) * (WEALTH_TAX_RATE / 100)

      const renterTaxableWealth = Math.max(
        0,
        savingsPortfolio * SAVINGS_VALUATION + askPortfolio * FINANCIAL_ASSET_VALUATION,
      )
      const renterWealthTax =
        Math.max(0, renterTaxableWealth - WEALTH_TAX_THRESHOLD) * (WEALTH_TAX_RATE / 100)

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

    const inflationFactor = Math.pow(1 + inflation / 100, year)

    const buyerEquity = homeValue - remainingMortgage - sharedDebt - sellingCost
      - (isAdvanced ? cumulativeBuyerWealthTax : 0)

    if (isFinalYear && isAdvanced && securityDeposit > 0) {
      savingsPortfolio += securityDeposit
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

    currentMonthlyRent *= 1 + rentIncrease / 100
    currentHoaFee *= 1 + (isAdvanced ? hoaFeeIncrease : 2) / 100
  }

  const finalYear = yearlyData[yearlyData.length - 1]
  const recommendation = finalYear.buyerNetWorth >= finalYear.renterNetWorth ? 'buy' : 'rent'
  const difference = Math.abs(finalYear.buyerNetWorth - finalYear.renterNetWorth)

  let breakevenYear: number | null = null
  for (let i = 1; i < yearlyData.length; i++) {
    const prev = yearlyData[i - 1]
    const curr = yearlyData[i]
    if (
      (prev.buyerNetWorth >= prev.renterNetWorth) !==
      (curr.buyerNetWorth >= curr.renterNetWorth)
    ) {
      breakevenYear = curr.year
      break
    }
  }

  const initialMonthlyMortgage =
    ioYears > 0 ? loanAmount * monthlyRate : monthlyAmortizingPayment

  return {
    yearlyData,
    recommendation,
    difference,
    breakevenYear,
    summary: {
      monthlyMortgagePayment: initialMonthlyMortgage,
      monthlyAmortizingPayment,
      downPayment,
      closingCosts,
      totalBuyerPaid,
      totalRenterPaid,
      finalHomeValue: finalYear.homeValue,
      finalEquity: finalYear.buyerNetWorth,
      finalRenterPortfolio: finalYear.renterNetWorth,
      finalRenterNominalGross: lastRenterNominalGross,
      finalAskTax: lastAskTax,
      finalRemainingMortgage: finalYear.remainingMortgage,
      initialMonthlyRent: monthlyRent,
      initialBuyerMonthly: yearlyData[0].buyerMonthlyCost,
    },
  }
}

export function formatInputNum(v: number): string {
  const parts = v.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return parts.join('.')
}

export function formatNOK(value: number, compact = false, locale = 'nb-NO'): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      const n = (value / 1_000_000).toFixed(1)
      const num = locale.startsWith('en') ? n : n.replace('.', ',')
      return locale.startsWith('en') ? `${num}m NOK` : `${num} mill. kr`
    }
    if (Math.abs(value) >= 1_000) {
      const k = Math.round(value / 1_000)
      return locale.startsWith('en') ? `${k}k NOK` : `${k} 000 kr`
    }
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatChartNOK(value: number, locale = 'nb-NO'): string {
  const dec = locale.startsWith('en') ? '.' : ','
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', dec)}M`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}`
}
