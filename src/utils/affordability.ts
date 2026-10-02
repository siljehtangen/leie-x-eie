import { computeStressTest, normalizeInputs } from './calculations'
import { MAX_DEBT_TO_INCOME } from '../constants/finance'
import type { Inputs, Mode } from '../types'

export interface Affordability {
  totalDebt: number
  maxDebt: number
  debtToIncome: number
  exceedsLimit: boolean
  stressedMonthlyPayment: number
  stressedShareOfIncome: number
}

export function computeAffordability(rawInputs: Inputs, mode: Mode): Affordability | null {
  const inputs = normalizeInputs(rawInputs)
  if (inputs.householdIncome <= 0) return null

  const isAdvanced = mode === 'advanced'
  const mortgage = Math.max(0, inputs.purchasePrice - inputs.downPayment)
  const sharedDebt = isAdvanced && inputs.isBorettslag ? inputs.sharedDebt : 0
  const otherDebt = isAdvanced ? inputs.otherDebt : 0
  const totalDebt = mortgage + sharedDebt + otherDebt
  const debtToIncome = totalDebt / inputs.householdIncome
  const stressedMonthlyPayment = computeStressTest(inputs, mode).monthlyPayment

  return {
    totalDebt,
    maxDebt: inputs.householdIncome * MAX_DEBT_TO_INCOME,
    debtToIncome,
    exceedsLimit: debtToIncome > MAX_DEBT_TO_INCOME,
    stressedMonthlyPayment,
    stressedShareOfIncome: stressedMonthlyPayment / (inputs.householdIncome / 12),
  }
}
