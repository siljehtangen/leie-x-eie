// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import SplitResults from './SplitResults'
import { renderWithProviders } from '../test/render'
import { calculate } from '../utils/calculations'
import { DEFAULT_INPUTS } from '../constants/defaults'

vi.mock('../hooks/useAnimatedValue', () => ({
  useAnimatedValue: (target: number) => target,
}))

describe('SplitResults', () => {
  it('shows the full stressed payment, including other debt', async () => {
    const inputs = { ...DEFAULT_INPUTS, otherDebt: 240_000 }
    const results = calculate(inputs, 'advanced')
    const { debtPayment, monthlyPayment } = results.summary.stressTest

    await renderWithProviders(<SplitResults results={results} years={inputs.years} />)

    const label = screen.getByText(/Stress test at/)
    const shown = label.nextElementSibling?.querySelector('.stat-value')?.textContent ?? ''
    expect(shown.replace(/\D/g, '')).toBe(String(Math.round(debtPayment)))
    expect(debtPayment).toBeGreaterThan(monthlyPayment)
  })
})
