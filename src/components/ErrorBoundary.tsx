import { Component, ErrorInfo, ReactNode } from 'react'
import i18next from 'i18next'

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
          background: '#F5F5F5',
          gap: 12,
        }}>
          <h1 style={{ color: '#008080', margin: 0 }}>{i18next.t('error.title')}</h1>
          <p style={{ color: '#555', margin: 0 }}>{i18next.t('error.message')}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 28px',
              background: '#008080',
              color: '#fff',
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
