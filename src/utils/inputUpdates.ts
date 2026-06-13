import { STAMP_DUTY_RATE, DEFAULT_DOWN_PAYMENT_RATE } from '../constants/finance'
import type { Inputs } from '../types'

export function applyInputChange(prev: Inputs, name: keyof Inputs, value: number | boolean): Inputs {
  const next: Inputs = { ...prev, [name]: value }

  if (name === 'purchasePrice' && typeof value === 'number') {
    if (prev.stampDuty === Math.round(prev.purchasePrice * STAMP_DUTY_RATE)) {
      next.stampDuty = Math.round(value * STAMP_DUTY_RATE)
    }
    if (prev.downPayment === Math.round(prev.purchasePrice * DEFAULT_DOWN_PAYMENT_RATE)) {
      next.downPayment = Math.round(value * DEFAULT_DOWN_PAYMENT_RATE)
    }
  }

  return next
}
