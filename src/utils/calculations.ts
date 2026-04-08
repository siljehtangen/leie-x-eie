import type { Inputs, Mode, CalculationResult, YearlyDataPoint } from '../types'

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
    interestDeduction,
  } = inputs

  const isAdvanced = mode === 'advanced'

  // ── Initial figures ──────────────────────────────────────────────────────────
  // sharedDebt (fellesgjeld) inflates effective property value and stays as a permanent liability
  const effectivePrice = purchasePrice + sharedDebt
  const loanAmount = purchasePrice - downPayment
  const closingCosts = stampDuty + (isAdvanced ? otherClosingCosts : 0)

  // Standard amortising mortgage payment
  const monthlyRate = mortgageRate / 100 / 12
  const numPayments = loanTermYears * 12
  const monthlyMortgagePayment =
    monthlyRate > 0
      ? loanAmount *
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments

  // ── State ────────────────────────────────────────────────────────────────────
  // Renter starts with what the buyer paid upfront — invested
  let renterPortfolio = downPayment + closingCosts
  let remainingMortgage = loanAmount
  let currentMonthlyRent = monthlyRent
  let currentHoaFee = monthlyHoaFee
  const monthlyInvestmentReturn = investmentReturn / 100 / 12

  // Advanced rent extras (per month)
  const advancedRentMonthly = isAdvanced
    ? (contentsInsurance + electricity + internet + parking * 12) / 12
    : 0

  // Advanced buy fixed extras per month
  const maintenanceMonthly = isAdvanced ? (purchasePrice * renovationPct) / 100 / 12 : 0
  const municipalFeesMonthly = isAdvanced ? municipalFees / 12 : 0
  const insuranceMonthly = isAdvanced ? homeInsurance / 12 : 0
  const propertyTaxMonthly = isAdvanced ? propertyTax / 12 : 0

  const yearlyData: YearlyDataPoint[] = []
  let totalBuyerPaid = closingCosts
  let totalRenterPaid = 0

  for (let year = 1; year <= years; year++) {
    let yearlyBuyerCashflow = 0
    let yearlyRenterCashflow = 0

    for (let month = 0; month < 12; month++) {
      const effectiveMortgage = remainingMortgage > 0 ? monthlyMortgagePayment : 0
      const interestPayment = remainingMortgage > 0 ? remainingMortgage * monthlyRate : 0
      const principalPayment = Math.min(effectiveMortgage - interestPayment, remainingMortgage)

      let buyerMonthlyCost = effectiveMortgage + currentHoaFee

      if (isAdvanced) {
        const taxDeductionMonthly = interestPayment * (interestDeduction / 100)
        buyerMonthlyCost +=
          maintenanceMonthly +
          municipalFeesMonthly +
          insuranceMonthly +
          propertyTaxMonthly -
          taxDeductionMonthly
      }

      const renterMonthlyCost = currentMonthlyRent + advancedRentMonthly

      // Positive diff → buyer pays more → renter saves & invests the difference
      const monthlyDiff = buyerMonthlyCost - renterMonthlyCost

      renterPortfolio = renterPortfolio * (1 + monthlyInvestmentReturn) + monthlyDiff

      if (remainingMortgage > 0) {
        remainingMortgage = Math.max(0, remainingMortgage - principalPayment)
      }

      yearlyBuyerCashflow += buyerMonthlyCost
      yearlyRenterCashflow += renterMonthlyCost
    }

    totalBuyerPaid += yearlyBuyerCashflow
    totalRenterPaid += yearlyRenterCashflow

    // Home value appreciates on the full effective price (purchase + fellesgjeld)
    const homeValue = effectivePrice * Math.pow(1 + appreciationRate / 100, year)
    const isFinalYear = year === years
    const sellingCost = isFinalYear ? brokerSellingFee : 0
    // Fellesgjeld stays as a liability — deducted from equity at sale
    const buyerEquity = homeValue - remainingMortgage - sharedDebt - sellingCost

    // Deflate both net worths to real (today's kr) using inflation
    const inflationFactor = Math.pow(1 + inflation / 100, year)

    yearlyData.push({
      year,
      buyerMonthlyCost: yearlyBuyerCashflow / 12,
      renterMonthlyCost: yearlyRenterCashflow / 12,
      buyerNetWorth: buyerEquity / inflationFactor,
      renterNetWorth: renterPortfolio / inflationFactor,
      homeValue,
      remainingMortgage,
    })

    // Update annually
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
    const prevWinner = prev.buyerNetWorth >= prev.renterNetWorth ? 'buy' : 'rent'
    const currWinner = curr.buyerNetWorth >= curr.renterNetWorth ? 'buy' : 'rent'
    if (prevWinner !== currWinner) {
      breakevenYear = curr.year
      break
    }
  }

  return {
    yearlyData,
    recommendation,
    difference,
    breakevenYear,
    summary: {
      monthlyMortgagePayment,
      downPayment,
      closingCosts,
      totalBuyerPaid,
      totalRenterPaid,
      finalHomeValue: finalYear.homeValue,
      finalEquity: finalYear.buyerNetWorth,
      finalRenterPortfolio: finalYear.renterNetWorth,
      finalRemainingMortgage: finalYear.remainingMortgage,
      initialMonthlyRent: monthlyRent,
      initialBuyerMonthly: yearlyData[0].buyerMonthlyCost,
    },
  }
}

export function formatNOK(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace('.', ',')} mill. kr`
    }
    if (Math.abs(value) >= 1_000) {
      return `${Math.round(value / 1_000)} 000 kr`
    }
  }
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatChartNOK(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}`
}
