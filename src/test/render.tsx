import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import i18n from '../i18n'
import { ThemeProvider } from '../hooks/useTheme'

export async function renderWithProviders(ui: ReactElement, lang: 'no' | 'en' = 'en') {
  await i18n.changeLanguage(lang)
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}
