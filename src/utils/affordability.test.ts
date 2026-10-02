import { describe, expect, it } from 'vitest'
import { computeAffordability } from './affordability'
import { computeStressTest } from './calculations'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('computeAffordability', () => {
  it('is skipped when no income is entered', () => {
    expect(computeAffordability(DEFAULT_INPUTS, 'quick')).toBeNull()
  })

  it('compares total debt with five times gross income', () => {
    const inputs = { ...DEFAULT_INPUTS, householdIncome: 700_000 }
    const loan = DEFAULT_INPUTS.purchasePrice - DEFAULT_INPUTS.downPayment
    const result = computeAffordability(inputs, 'quick')!
    expect(result.totalDebt).toBe(loan)
    expect(result.maxDebt).toBe(3_500_000)
    expect(result.debtToIncome).toBeCloseTo(loan / 700_000, 10)
    expect(result.exceedsLimit).toBe(false)
    expect(computeAffordability({ ...inputs, householdIncome: 600_000 }, 'quick')!.exceedsLimit).toBe(true)
  })

  it('counts shared debt and other debt only in advanced mode', () => {
    const inputs = { ...DEFAULT_INPUTS, householdIncome: 800_000, isBorettslag: true, sharedDebt: 500_000, otherDebt: 200_000 }
    const loan = DEFAULT_INPUTS.purchasePrice - DEFAULT_INPUTS.downPayment
    expect(computeAffordability(inputs, 'quick')!.totalDebt).toBe(loan)
    expect(computeAffordability(inputs, 'advanced')!.totalDebt).toBe(loan + 700_000)
  })

  it('relates the stress-test payment to gross monthly income', () => {
    const inputs = { ...DEFAULT_INPUTS, householdIncome: 900_000 }
    const result = computeAffordability(inputs, 'quick')!
    const stressed = computeStressTest(inputs, 'quick').debtPayment
    expect(result.stressedMonthlyPayment).toBe(stressed)
    expect(result.stressedShareOfIncome).toBeCloseTo(stressed / 75_000, 10)
  })

  it('includes stressed other debt in the payment in advanced mode only', () => {
    const inputs = { ...DEFAULT_INPUTS, householdIncome: 900_000, otherDebt: 120_000 }
    const quick = computeAffordability(inputs, 'quick')!
    const advanced = computeAffordability(inputs, 'advanced')!
    const rate = computeStressTest(inputs, 'advanced').ratePct
    expect(advanced.stressedMonthlyPayment - quick.stressedMonthlyPayment).toBeCloseTo(120_000 * (rate / 100) / 12, 6)
  })
})
