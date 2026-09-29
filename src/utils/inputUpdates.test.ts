import { describe, expect, it } from 'vitest'
import { applyInputChange } from './inputUpdates'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('applyInputChange', () => {
  it('keeps stamp duty and down payment in sync with price while they track the defaults', () => {
    const next = applyInputChange(DEFAULT_INPUTS, 'purchasePrice', 5_000_000)
    expect(next.stampDuty).toBe(125_000)
    expect(next.downPayment).toBe(750_000)
  })

  it('leaves user-customised stamp duty and down payment alone', () => {
    const custom = { ...DEFAULT_INPUTS, stampDuty: 0, downPayment: 1_000_000 }
    const next = applyInputChange(custom, 'purchasePrice', 5_000_000)
    expect(next.stampDuty).toBe(0)
    expect(next.downPayment).toBe(1_000_000)
  })

  it('updates other fields without side effects', () => {
    const next = applyInputChange(DEFAULT_INPUTS, 'bsuActive', true)
    expect(next).toEqual({ ...DEFAULT_INPUTS, bsuActive: true })
  })
})
