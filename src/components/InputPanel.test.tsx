// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import InputPanel from './InputPanel'
import { renderWithProviders } from '../test/render'
import { DEFAULT_INPUTS } from '../constants/defaults'

describe('InputPanel', () => {
  it('reports parsed numbers, accepting spaces and a decimal comma', async () => {
    const onInputChange = vi.fn()
    await renderWithProviders(<InputPanel inputs={DEFAULT_INPUTS} onInputChange={onInputChange} mode="quick" />, 'no')
    fireEvent.change(screen.getByRole('textbox', { name: 'Kjøpesum' }), { target: { value: '5 250 000' } })
    expect(onInputChange).toHaveBeenLastCalledWith('purchasePrice', 5_250_000)
    fireEvent.change(screen.getByRole('textbox', { name: 'Boliglånsrente' }), { target: { value: '4,9' } })
    expect(onInputChange).toHaveBeenLastCalledWith('mortgageRate', 4.9)
  })

  it('keeps the housing-cooperative choice in advanced mode', async () => {
    const props = { inputs: DEFAULT_INPUTS, onInputChange: () => {} }
    const { rerender } = await renderWithProviders(<InputPanel {...props} mode="quick" />)
    expect(screen.queryByRole('checkbox', { name: /Housing cooperative/ })).toBeNull()
    rerender(<InputPanel {...props} mode="advanced" />)
    expect(screen.getByRole('checkbox', { name: /Housing cooperative/ })).toBeTruthy()
  })

  it('only offers rental income and other debt in advanced mode', async () => {
    const props = { inputs: DEFAULT_INPUTS, onInputChange: () => {} }
    const { rerender } = await renderWithProviders(<InputPanel {...props} mode="quick" />)
    expect(screen.queryByRole('button', { name: /Running ownership costs/ })).toBeNull()

    rerender(<InputPanel {...props} mode="advanced" />)
    fireEvent.click(screen.getByRole('button', { name: /Running ownership costs/ }))
    fireEvent.click(screen.getByRole('button', { name: /Loan details/ }))
    expect(screen.getByRole('textbox', { name: 'Rental Income From Letting Part of the Home' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Other Debt' })).toBeTruthy()
  })

  it('counts other debt towards the debt-to-income warning in advanced mode', async () => {
    const inputs = { ...DEFAULT_INPUTS, householdIncome: 700_000, otherDebt: 300_000 }
    const { rerender } = await renderWithProviders(
      <InputPanel inputs={inputs} onInputChange={() => {}} mode="quick" />,
    )
    expect(screen.queryByText(/Total debt would be/)).toBeNull()
    rerender(<InputPanel inputs={inputs} onInputChange={() => {}} mode="advanced" />)
    expect(screen.getByText(/Total debt would be 5\.3 times income/)).toBeTruthy()
  })
})
