// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './test/render'
import { encodeScenario } from './utils/shareUrl'
import { DEFAULT_INPUTS } from './constants/defaults'

const field = (label: string) => screen.getByRole('textbox', { name: label })

describe('App', () => {
  it('shows results with break-even thresholds after calculating', async () => {
    await renderWithProviders(<App />)
    expect(screen.queryByRole('heading', { name: 'Your Rent vs Buy Analysis' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Calculate/ }))

    expect(await screen.findByRole('heading', { name: 'Your Rent vs Buy Analysis' })).toBeTruthy()
    const thresholds = screen.getByRole('list', { name: 'When the answer flips' })
    expect(within(thresholds).getByText(/Owning wins when rent is above/)).toBeTruthy()
    expect(within(thresholds).getByText(/Owning wins when house prices grow faster than/)).toBeTruthy()
  })

  it('warns about the debt-to-income limit and shows the affordability card', async () => {
    await renderWithProviders(<App />)
    fireEvent.change(field('Gross Annual Household Income'), { target: { value: '500000' } })
    expect(screen.getByText(/Total debt would be 6\.8 times income/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Calculate/ }))
    expect(await screen.findByRole('heading', { name: 'Above the debt-to-income limit' })).toBeTruthy()

    fireEvent.change(field('Gross Annual Household Income'), { target: { value: '1000000' } })
    expect(await screen.findByRole('heading', { name: 'Within the debt-to-income limit' })).toBeTruthy()
    expect(screen.queryByText(/Total debt would be/)).toBeNull()
  })

  it('opens a shared link straight into the results with its inputs', async () => {
    const hash = encodeScenario({ mode: 'quick', inputs: { ...DEFAULT_INPUTS, monthlyRent: 23_000 } })
    window.history.replaceState(null, '', `/#${hash}`)
    await renderWithProviders(<App />)

    expect(await screen.findByRole('heading', { name: 'Your Rent vs Buy Analysis' })).toBeTruthy()
    expect((field('Monthly Rent') as HTMLInputElement).value).toBe('23\u202f000')
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('')
  })

  it('still opens a legacy query share link and then drops it from the address bar', async () => {
    const search = encodeScenario({ mode: 'quick', inputs: { ...DEFAULT_INPUTS, monthlyRent: 18_000 } })
    window.history.replaceState(null, '', `/?${search}`)
    await renderWithProviders(<App />)

    expect(await screen.findByRole('heading', { name: 'Your Rent vs Buy Analysis' })).toBeTruthy()
    expect((field('Monthly Rent') as HTMLInputElement).value).toBe('18\u202f000')
    expect(window.location.search).toBe('')
  })

  it('saves the current inputs as a scenario and lists it for comparison', async () => {
    await renderWithProviders(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Calculate/ }))
    await screen.findByRole('heading', { name: 'Compare scenarios' })

    fireEvent.change(screen.getByRole('textbox', { name: 'Scenario name' }), { target: { value: 'Grünerløkka' } })
    fireEvent.click(screen.getByRole('button', { name: /Save current/ }))

    expect(screen.getByRole('button', { name: 'Load Grünerløkka into the form' })).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem('leiexeie:saved:v1')!)[0].name).toBe('Grünerløkka')
  })
})
