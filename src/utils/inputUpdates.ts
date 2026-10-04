import { STAMP_DUTY_RATE, DEFAULT_DOWN_PAYMENT_RATE } from '../constants/finance'
import type { PresetValues } from '../constants/presets'
import type { Inputs } from '../types'

export function applyInputChange(prev: Inputs, name: keyof Inputs, value: number | boolean): Inputs {
  const next: Inputs = { ...prev, [name]: value }
  const autoStampDuty = (inputs: Inputs) =>
    inputs.isBorettslag ? 0 : Math.round(inputs.purchasePrice * STAMP_DUTY_RATE)
  const stampDutyWasAuto = prev.stampDuty === autoStampDuty(prev)

  if (name === 'purchasePrice' && typeof value === 'number') {
    if (prev.downPayment === Math.round(prev.purchasePrice * DEFAULT_DOWN_PAYMENT_RATE)) {
      next.downPayment = Math.round(value * DEFAULT_DOWN_PAYMENT_RATE)
    }
  }

  if (name === 'isBorettslag' && value === false) {
    next.sharedDebt = 0
  }

  if ((name === 'purchasePrice' || name === 'isBorettslag') && stampDutyWasAuto) {
    next.stampDuty = autoStampDuty(next)
  }

  return next
}

export function applyPreset(prev: Inputs, values: PresetValues): Inputs {
  return {
    ...applyInputChange(prev, 'purchasePrice', values.purchasePrice),
    monthlyRent: values.monthlyRent,
    monthlyHoaFee: values.monthlyHoaFee,
  }
}

export function matchesPreset(inputs: Inputs, values: PresetValues): boolean {
  return (Object.keys(values) as (keyof PresetValues)[]).every(key => inputs[key] === values[key])
}
