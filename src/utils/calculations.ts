import type { Inputs, Mode, CalculationResult, YearlyDataPoint } from '../types'

const WEALTH_TAX_THRESHOLD = 1_700_000     
const PRIMARY_RESIDENCE_VALUATION = 0.25 
const FINANCIAL_ASSET_VALUATION = 0.80    
const SECURITY_DEPOSIT_MONTHS = 3   

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
    sharedDebtRate,
    interestOnlyYears,
    investmentTaxRate,
    wealthTaxRate,
  } = inputs

  const isAdvanced = mode === 'advanced'

  // ── Initial figures ──────────────────────────────────────────────────────────
  // sharedDebt (fellesgjeld) inflates effective property value and stays as a permanent liability
  const effectivePrice = purchasePrice + sharedDebt
  const loanAmount = purchasePrice - downPayment
  const closingCosts = stampDuty + (isAdvanced ? otherClosingCosts : 0)

  // Security deposit: renter ties up 3 months rent upfront; returned at face value at end
  const securityDeposit = isAdvanced ? monthlyRent * SECURITY_DEPOSIT_MONTHS : 0

  // ── Mortgage ─────────────────────────────────────────────────────────────────
  const monthlyRate = mortgageRate / 100 / 12
  const ioYears = isAdvanced ? Math.min(interestOnlyYears, loanTermYears - 1) : 0
  const numPayments = loanTermYears * 12
  const remainingTermMonths = numPayments - ioYears * 12

  // Amortising payment applies after the interest-only period (or from day 1 if ioYears = 0)
  const monthlyAmortizingPayment =
    remainingTermMonths > 0
      ? monthlyRate > 0
        ? loanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, remainingTermMonths)) /
          (Math.pow(1 + monthlyRate, remainingTermMonths) - 1)
        : loanAmount / remainingTermMonths
      : 0

  // ── Investment return (after tax) ────────────────────────────────────────────
  // In a regular brokerage account (not ASK), returns are taxed annually.
  // Home appreciation is tax-free for primary residence (held 12/24 months rule).
  const effectiveAnnualReturn = isAdvanced
    ? investmentReturn * (1 - investmentTaxRate / 100)
    : investmentReturn
  const monthlyInvestmentReturn = effectiveAnnualReturn / 100 / 12

  // ── State ────────────────────────────────────────────────────────────────────
  // Renter invests what the buyer spent upfront, minus the security deposit (locked up)
  let renterPortfolio = downPayment + closingCosts - securityDeposit
  let remainingMortgage = loanAmount
  let currentMonthlyRent = monthlyRent
  let currentHoaFee = monthlyHoaFee

  // Renter monthly extras (advanced): innboforsikring + electricity + internet + parking
  const advancedRentMonthly = isAdvanced
    ? (contentsInsurance + electricity + internet + parking * 12) / 12
    : 0

  // Shared utilities (electricity + internet): both buyer and renter pay these equally.
  // Adding them to the buyer neutralises the previous asymmetry; the diff is unchanged.
  const sharedUtilitiesMonthly = isAdvanced ? (electricity + internet) / 12 : 0

  // Advanced buy extras — base values; some are inflation-adjusted per year
  const municipalFeesBase = isAdvanced ? municipalFees / 12 : 0
  const insuranceMonthly = isAdvanced ? homeInsurance / 12 : 0
  const propertyTaxMonthly = isAdvanced ? propertyTax / 12 : 0

  // Fellesgjeld carries its own interest that is also tax-deductible (rentefradrag)
  const sharedDebtMonthlyInterest = isAdvanced
    ? sharedDebt * (sharedDebtRate / 100) / 12
    : 0

  const yearlyData: YearlyDataPoint[] = []
  let totalBuyerPaid = closingCosts
  let totalRenterPaid = 0

  for (let year = 1; year <= years; year++) {
    let yearlyBuyerCashflow = 0
    let yearlyRenterCashflow = 0

    const isInterestOnly = ioYears > 0 && year <= ioYears

    // Maintenance and municipal fees grow with inflation year-over-year
    const inflationMultiplier = Math.pow(1 + inflation / 100, year - 1)
    const maintenanceMonthly = isAdvanced
      ? (purchasePrice * renovationPct / 100 / 12) * inflationMultiplier
      : 0
    const municipalFeesMonthly = municipalFeesBase * inflationMultiplier

    // ── Monthly loop ───────────────────────────────────────────────────────────
    for (let month = 0; month < 12; month++) {
      const interestPayment = remainingMortgage > 0 ? remainingMortgage * monthlyRate : 0

      let effectiveMortgage: number
      let principalPayment: number

      if (remainingMortgage <= 0) {
        effectiveMortgage = 0
        principalPayment = 0
      } else if (isInterestOnly) {
        // Avdragsfrihet: pay interest only, no principal
        effectiveMortgage = interestPayment
        principalPayment = 0
      } else {
        effectiveMortgage = monthlyAmortizingPayment
        principalPayment = Math.min(effectiveMortgage - interestPayment, remainingMortgage)
      }

      let buyerMonthlyCost = effectiveMortgage + currentHoaFee + sharedUtilitiesMonthly

      if (isAdvanced) {
        // Combined deductible interest: mortgage + fellesgjeld interest
        const taxDeductionMonthly =
          (interestPayment + sharedDebtMonthlyInterest) * (interestDeduction / 100)
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

    // Home value appreciates on the full effective price (purchase + fellesgjeld)
    const homeValue = effectivePrice * Math.pow(1 + appreciationRate / 100, year)
    const isFinalYear = year === years
    const sellingCost = isFinalYear ? brokerSellingFee : 0
    // Fellesgjeld stays as a liability — deducted from equity at sale
    const buyerEquity = homeValue - remainingMortgage - sharedDebt - sellingCost

    // ── Wealth tax (formuesskatt) — advanced only ────────────────────────────
    // Primary residence is valued at 25% of market value; financial assets at 80%.
    // This is one of the largest structural advantages of homeownership in Norway.
    if (isAdvanced) {
      const buyerTaxableWealth = Math.max(
        0,
        homeValue * PRIMARY_RESIDENCE_VALUATION - remainingMortgage - sharedDebt,
      )
      const buyerWealthTax =
        Math.max(0, buyerTaxableWealth - WEALTH_TAX_THRESHOLD) * (wealthTaxRate / 100)

      const renterTaxableWealth = Math.max(0, renterPortfolio * FINANCIAL_ASSET_VALUATION)
      const renterWealthTax =
        Math.max(0, renterTaxableWealth - WEALTH_TAX_THRESHOLD) * (wealthTaxRate / 100)

      // Buyer wealth tax is an annual cash outflow → increases effective buyer costs.
      // In the model this means the renter captures that saving (+buyerWealthTax),
      // then pays their own higher wealth tax (-renterWealthTax).
      yearlyBuyerCashflow += buyerWealthTax
      renterPortfolio += buyerWealthTax
      renterPortfolio -= renterWealthTax
    }

    // Security deposit returned to renter at the end of the holding period (face value)
    if (isFinalYear && isAdvanced) {
      renterPortfolio += securityDeposit
    }

    totalBuyerPaid += yearlyBuyerCashflow
    totalRenterPaid += yearlyRenterCashflow

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
    if (
      (prev.buyerNetWorth >= prev.renterNetWorth) !==
      (curr.buyerNetWorth >= curr.renterNetWorth)
    ) {
      breakevenYear = curr.year
      break
    }
  }

  // Initial monthly mortgage for summary display (interest-only if applicable)
  const initialMonthlyMortgage =
    ioYears > 0 ? loanAmount * monthlyRate : monthlyAmortizingPayment

  return {
    yearlyData,
    recommendation,
    difference,
    breakevenYear,
    summary: {
      monthlyMortgagePayment: initialMonthlyMortgage,
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
