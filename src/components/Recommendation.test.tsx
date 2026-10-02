// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import Recommendation from './Recommendation'
import { renderWithProviders } from '../test/render'
import { calculate } from '../utils/calculations'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('Recommendation', () => {
  it('compares full monthly costs, so costs both sides pay do not widen the gap', async () => {
    const inputs = { ...DEFAULT_INPUTS, electricity: 99_999 }
    const results = calculate(inputs, 'advanced')
    const gap = results.summary.initialBuyerMonthly - results.summary.year1RenterCosts.total
    const inflated = results.summary.initialBuyerMonthly - results.summary.initialMonthlyRent

    await renderWithProviders(<Recommendation results={results} inputs={inputs} mode="advanced" />)

    const label = screen.getByText('Buying costs more per month (year 1)')
    const shown = label.nextElementSibling?.textContent ?? ''
    expect(shown.replace(/\D/g, '')).toBe(String(Math.round(Math.abs(gap))))
    expect(gap).not.toBeCloseTo(inflated, 0)
    expect(shown.replace(/\D/g, '')).not.toBe(String(Math.round(Math.abs(inflated))))
  })
})
