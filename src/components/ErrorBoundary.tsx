import { Component, ErrorInfo, ReactNode } from 'react'
import i18next from 'i18next'
import { COLORS } from '../constants/theme'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'Inter, sans-serif',
          background: COLORS.bg,
          gap: 12,
        }}>
          <h1 style={{ color: COLORS.text, margin: 0 }}>{i18next.t('error.title')}</h1>
          <p style={{ color: COLORS.textSecondary, margin: 0 }}>{i18next.t('error.message')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 28px',
              background: COLORS.buy,
              color: COLORS.surface,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            {i18next.t('error.button')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
