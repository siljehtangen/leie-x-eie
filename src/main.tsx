import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/index.ts'
import App from './App.tsx'
import './styles/index.css'
import { applyThemeVars } from './constants/theme.ts'
import { initialTheme } from './utils/themeStorage.ts'
import { ThemeProvider } from './hooks/useTheme.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

applyThemeVars(initialTheme())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
