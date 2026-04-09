import type { Inputs, Mode, CalculationResult, YearlyDataPoint } from '../types'

// ── Norwegian law constants (as of 2025) ─────────────────────────────────────
const WEALTH_TAX_THRESHOLD = 1_700_000       // Bunnfradrag formuesskatt
const WEALTH_TAX_RATE = 1.0                  // 1.0% (under 20 MNOK)
const PRIMARY_RESIDENCE_VALUATION = 0.25     // Primærbolig verdsettes til 25%
const SAVINGS_VALUATION = 1.0                // Bankinnskudd: 100% av markedsverdi
const FINANCIAL_ASSET_VALUATION = 0.80       // Aksjer/ASK: 80% av markedsverdi
const INTEREST_DEDUCTION = 0.22              // Rentefradrag: 22%
const SAVINGS_TAX_RATE = 0.22               // Skatt på renteinntekter: 22%
const ASK_TAX_RATE = 0.3784                 // Aksjonærmodellen: 37.84% ved uttak
const QUICK_INVESTMENT_TAX = 0.22           // Sparekonto-skatt i enkel modus (renteinntekter 22%)
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
    sharedDebtRate,
    interestOnlyYears,
    savingsAccountBalance,
    savingsAccountRate,
    askRate,
  } = inputs

  const isAdvanced = mode === 'advanced'

  // ── Initial figures ──────────────────────────────────────────────────────────
  const effectivePrice = purchasePrice + sharedDebt
  const loanAmount = purchasePrice - downPayment
  const closingCosts = stampDuty + (isAdvanced ? otherClosingCosts : 0)
  const securityDeposit = isAdvanced ? monthlyRent * SECURITY_DEPOSIT_MONTHS : 0

  // ── Mortgage ─────────────────────────────────────────────────────────────────
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

  // ── Renter portfolio setup ───────────────────────────────────────────────────
  const initialInvestment = downPayment + closingCosts - securityDeposit

  // Quick mode: single portfolio with approximate 37% tax on returns
  const quickMonthlyReturn = investmentReturn / 100 / 12 * (1 - QUICK_INVESTMENT_TAX)

  // Advanced mode: split into savings account (sparekonto) + ASK
  // Savings account: interest taxed annually at 22% (modelled as net monthly return)
  // ASK: returns compound tax-free; capital gains tax (37.84%) applied at withdrawal
  const savingsInitial = isAdvanced
    ? Math.min(savingsAccountBalance, Math.max(0, initialInvestment))
    : 0
  const askInitial = isAdvanced ? Math.max(0, initialInvestment - savingsInitial) : 0

  const savingsMonthlyReturn = savingsAccountRate / 100 / 12 * (1 - SAVINGS_TAX_RATE)
  const askMonthlyReturn = askRate / 100 / 12

  // ── State ────────────────────────────────────────────────────────────────────
  let renterPortfolio = initialInvestment  // quick mode only
  let savingsPortfolio = savingsInitial    // advanced mode
  let askPortfolio = askInitial            // advanced mode (gross, pre-tax)
  let askCostBasis = askInitial            // tracks net contributions for gains calc

  let remainingMortgage = loanAmount
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
  let totalBuyerPaid = closingCosts
  let totalRenterPaid = 0

  for (let year = 1; year <= years; year++) {
    let yearlyBuyerCashflow = 0
    let yearlyRenterCashflow = 0

    const isInterestOnly = ioYears > 0 && year <= ioYears
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
        effectiveMortgage = interestPayment
        principalPayment = 0
      } else {
        effectiveMortgage = monthlyAmortizingPayment
        principalPayment = Math.min(effectiveMortgage - interestPayment, remainingMortgage)
      }

      // Bug fix 1: rentefradrag (22%) applies in both modes — it's universal Norwegian tax law
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

      const renterMonthlyCost = currentMonthlyRent + advancedRentMonthly
      const monthlyDiff = buyerMonthlyCost - renterMonthlyCost

      if (isAdvanced) {
        // Savings account grows independently each month (tax already baked in)
        savingsPortfolio *= (1 + savingsMonthlyReturn)
        // Monthly diff (positive = renter saves, negative = renter spends extra) → ASK
        askPortfolio = askPortfolio * (1 + askMonthlyReturn) + monthlyDiff
        // Bug fix 2: clamp cost basis at 0 — negative basis creates phantom capital gains
        askCostBasis = Math.max(0, askCostBasis + monthlyDiff)
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
    const buyerEquity = homeValue - remainingMortgage - sharedDebt - sellingCost

    // ── Wealth tax (formuesskatt) — advanced only ────────────────────────────
    if (isAdvanced) {
      const buyerTaxableWealth = Math.max(
        0,
        homeValue * PRIMARY_RESIDENCE_VALUATION - remainingMortgage - sharedDebt,
      )
      const buyerWealthTax =
        Math.max(0, buyerTaxableWealth - WEALTH_TAX_THRESHOLD) * (WEALTH_TAX_RATE / 100)

      // Renter's taxable wealth: savings at 100%, ASK at 80%
      const renterTaxableWealth = Math.max(
        0,
        savingsPortfolio * SAVINGS_VALUATION + askPortfolio * FINANCIAL_ASSET_VALUATION,
      )
      const renterWealthTax =
        Math.max(0, renterTaxableWealth - WEALTH_TAX_THRESHOLD) * (WEALTH_TAX_RATE / 100)

      // Bug fix 3: buyer wealth tax tracked separately — not added to yearlyBuyerCashflow
      // so it doesn't inflate the monthly cost display column in the table
      totalBuyerPaid += buyerWealthTax
      askPortfolio += buyerWealthTax
      askCostBasis = Math.max(0, askCostBasis + buyerWealthTax)

      // Renter pays own wealth tax — deduct from savings first, then ASK
      const fromSavings = Math.min(renterWealthTax, savingsPortfolio)
      savingsPortfolio -= fromSavings
      const fromAsk = renterWealthTax - fromSavings
      if (fromAsk > 0) {
        askPortfolio -= fromAsk
        askCostBasis = Math.max(0, askCostBasis - fromAsk)
      }
    }

    // Security deposit returned to renter at end of holding period
    if (isFinalYear && isAdvanced) {
      savingsPortfolio += securityDeposit
    }

    totalBuyerPaid += yearlyBuyerCashflow
    totalRenterPaid += yearlyRenterCashflow

    const inflationFactor = Math.pow(1 + inflation / 100, year)

    // Renter net worth: savings (already net of tax) + ASK gross - deferred capital gains tax
    let renterNetWorth: number
    if (isAdvanced) {
      const askGains = Math.max(0, askPortfolio - askCostBasis)
      const askTax = askGains * ASK_TAX_RATE
      renterNetWorth = (savingsPortfolio + askPortfolio - askTax) / inflationFactor
    } else {
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
