import { BREAKEVEN_APPRECIATION_MAX, INPUT_BOUNDS } from '../constants/inputBounds'
import { calculate } from './calculations'
import type { Inputs, Mode } from '../types'

export type BreakevenKey = 'monthlyRent' | 'appreciationRate'

const SEARCH_RANGE: Record<BreakevenKey, [number, number]> = {
  monthlyRent: [0, 200_000],
  appreciationRate: [INPUT_BOUNDS.appreciationRate.min, BREAKEVEN_APPRECIATION_MAX],
}
const ITERATIONS = 40

export function buyAdvantage(inputs: Inputs, mode: Mode): number {
  const { yearlyData } = calculate(inputs, mode)
  const last = yearlyData[yearlyData.length - 1]
  return last.buyerNetWorth - last.renterNetWorth
}

// Buying gets strictly better as either rent or price growth rises, so bisection finds the single crossing.
export function solveBreakeven(inputs: Inputs, mode: Mode, key: BreakevenKey): number | null {
  let [lo, hi] = SEARCH_RANGE[key]
  const at = (value: number) => buyAdvantage({ ...inputs, [key]: value }, mode)
  if (at(lo) >= 0 || at(hi) < 0) return null

  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2
    if (at(mid) >= 0) hi = mid
    else lo = mid
  }
  return hi
}

export interface BreakevenThresholds {
  monthlyRent: number | null
  appreciationRate: number | null
}

export function computeBreakevenThresholds(inputs: Inputs, mode: Mode): BreakevenThresholds {
  return {
    monthlyRent: solveBreakeven(inputs, mode, 'monthlyRent'),
    appreciationRate: solveBreakeven(inputs, mode, 'appreciationRate'),
  }
}
