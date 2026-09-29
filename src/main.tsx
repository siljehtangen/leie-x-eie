import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/index.ts'
import App from './App.tsx'
import './styles/index.css'
import { applyThemeVars } from './constants/theme.ts'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

applyThemeVars()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
