// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import Sensitivity from './Sensitivity'
import { renderWithProviders } from '../test/render'
import { DEFAULT_INPUTS } from '../constants/defaults'

const select = (name: string) => screen.getByRole('combobox', { name }) as HTMLSelectElement

describe('Sensitivity', () => {
  it('starts with house prices against the mortgage rate', async () => {
    await renderWithProviders(<Sensitivity inputs={DEFAULT_INPUTS} mode="quick" />)
    expect(select('Rows').value).toBe('appreciationRate')
    expect(select('Columns').value).toBe('mortgageRate')
    expect(screen.getAllByRole('row')).toHaveLength(6)
  })

  it('swaps the axes instead of plotting one variable against itself', async () => {
    await renderWithProviders(<Sensitivity inputs={DEFAULT_INPUTS} mode="quick" />)
    fireEvent.change(select('Rows'), { target: { value: 'mortgageRate' } })
    expect(select('Rows').value).toBe('mortgageRate')
    expect(select('Columns').value).toBe('appreciationRate')
  })

  it('re-labels the grid for the chosen axis', async () => {
    await renderWithProviders(<Sensitivity inputs={DEFAULT_INPUTS} mode="quick" />)
    fireEvent.change(select('Columns'), { target: { value: 'returnRate' } })
    expect(screen.getByRole('columnheader', { name: /Return on savings/ })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: '7%' })).toBeTruthy()
  })
})
