import { calculate } from './calculations'
import type { Inputs, Mode } from '../types'

export const SENSITIVITY_OFFSETS = [-2, -1, 0, 1, 2] as const

export interface SensitivityCell {
  mortgageRate: number
  buyAdvantage: number
}

export interface SensitivityRow {
  appreciationRate: number
  cells: SensitivityCell[]
}

export interface SensitivityGrid {
  mortgageRates: number[]
  rows: SensitivityRow[]
  baseAppreciation: number
  baseMortgageRate: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

// Real (inflation-adjusted) buyer net worth minus renter net worth at the horizon.
export function buildSensitivityGrid(inputs: Inputs, mode: Mode): SensitivityGrid {
  const rateOffsets = SENSITIVITY_OFFSETS.filter(o => inputs.mortgageRate + o > 0)
  const mortgageRates = rateOffsets.map(o => round1(inputs.mortgageRate + o))

  const rows = SENSITIVITY_OFFSETS.map(appOffset => {
    const appreciationRate = round1(inputs.appreciationRate + appOffset)
    return {
      appreciationRate,
      cells: rateOffsets.map(rateOffset => {
        const scenario: Inputs = {
          ...inputs,
          appreciationRate,
          mortgageRate: inputs.mortgageRate + rateOffset,
          mortgageRateAfterChange: Math.max(0, inputs.mortgageRateAfterChange + rateOffset),
        }
        const { yearlyData } = calculate(scenario, mode)
        const last = yearlyData[yearlyData.length - 1]
        return {
          mortgageRate: round1(inputs.mortgageRate + rateOffset),
          buyAdvantage: last.buyerNetWorth - last.renterNetWorth,
        }
      }),
    }
  })

  return {
    mortgageRates,
    rows,
    baseAppreciation: round1(inputs.appreciationRate),
    baseMortgageRate: round1(inputs.mortgageRate),
  }
}
