import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/index.ts'
import App from './App.tsx'
import './App.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
