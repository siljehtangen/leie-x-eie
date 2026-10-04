import { buyAdvantage } from './breakeven'
import type { Inputs, Mode } from '../types'

export const SENSITIVITY_OFFSETS = [-2, -1, 0, 1, 2] as const

export const SENSITIVITY_AXES = ['appreciationRate', 'mortgageRate', 'returnRate', 'rentIncrease'] as const
export type SensitivityAxis = (typeof SENSITIVITY_AXES)[number]

export interface SensitivityCell {
  value: number
  buyAdvantage: number
}

export interface SensitivityRow {
  value: number
  cells: SensitivityCell[]
}

export interface SensitivityGrid {
  rowAxis: SensitivityAxis
  colAxis: SensitivityAxis
  colValues: number[]
  rows: SensitivityRow[]
  baseRow: number
  baseCol: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

// The renter's surplus goes to the savings account in quick mode and to ASK in advanced mode.
function returnKey(mode: Mode): 'investmentReturn' | 'askRate' {
  return mode === 'advanced' ? 'askRate' : 'investmentReturn'
}

export function axisValue(inputs: Inputs, mode: Mode, axis: SensitivityAxis): number {
  return axis === 'returnRate' ? inputs[returnKey(mode)] : inputs[axis]
}

function withAxis(inputs: Inputs, mode: Mode, axis: SensitivityAxis, offset: number): Inputs {
  switch (axis) {
    case 'returnRate': {
      const key = returnKey(mode)
      return { ...inputs, [key]: inputs[key] + offset }
    }
    case 'mortgageRate':
      return {
        ...inputs,
        mortgageRate: inputs.mortgageRate + offset,
        mortgageRateAfterChange: Math.max(0, inputs.mortgageRateAfterChange + offset),
      }
    default:
      return { ...inputs, [axis]: inputs[axis] + offset }
  }
}

// Home prices can fall and the mortgage rate must stay positive; the other axes stop at zero.
function isValidValue(axis: SensitivityAxis, value: number): boolean {
  if (axis === 'appreciationRate') return true
  if (axis === 'mortgageRate') return value > 0
  return value >= 0
}

function offsetsFor(inputs: Inputs, mode: Mode, axis: SensitivityAxis): number[] {
  const base = axisValue(inputs, mode, axis)
  return SENSITIVITY_OFFSETS.filter(o => isValidValue(axis, round1(base + o)))
}

// Real (inflation-adjusted) buyer net worth minus renter net worth at the horizon.
export function buildSensitivityGrid(
  inputs: Inputs,
  mode: Mode,
  rowAxis: SensitivityAxis = 'appreciationRate',
  colAxis: SensitivityAxis = 'mortgageRate',
): SensitivityGrid {
  const baseRow = round1(axisValue(inputs, mode, rowAxis))
  const baseCol = round1(axisValue(inputs, mode, colAxis))
  const colOffsets = offsetsFor(inputs, mode, colAxis)

  const rows = offsetsFor(inputs, mode, rowAxis).map(rowOffset => {
    const rowInputs = withAxis(inputs, mode, rowAxis, rowOffset)
    return {
      value: round1(baseRow + rowOffset),
      cells: colOffsets.map(colOffset => ({
        value: round1(baseCol + colOffset),
        buyAdvantage: buyAdvantage(withAxis(rowInputs, mode, colAxis, colOffset), mode),
      })),
    }
  })

  return {
    rowAxis,
    colAxis,
    colValues: colOffsets.map(o => round1(baseCol + o)),
    rows,
    baseRow,
    baseCol,
  }
}
