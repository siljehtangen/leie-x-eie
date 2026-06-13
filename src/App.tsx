import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import ModeToggle from './components/ModeToggle'
import InputPanel from './components/InputPanel'
import SplitResults from './components/SplitResults'
import Charts from './components/Charts'
import Recommendation from './components/Recommendation'
import { calculate } from './utils/calculations'
import { applyInputChange } from './utils/inputUpdates'
import { DEFAULT_INPUTS } from './constants/defaults'
import { APP_NAME, SCROLL_DELAY_MS } from './constants/app'
import type { Inputs, Mode, Lang, CalculationResult } from './types'

const CalculationBreakdown = lazy(() => import('./components/CalculationBreakdown'))

function resolveLang(language: string): Lang {
  return language.startsWith('en') ? 'en' : 'no'
}

export default function App() {
  const { t, i18n } = useTranslation()
  const lang = resolveLang(i18n.language)
  const [mode, setMode] = useState<Mode>('quick')
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [results, setResults] = useState<CalculationResult | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = t('header.pageTitle')
  }, [t])

  useEffect(() => {
    document.documentElement.lang = lang === 'no' ? 'nb' : 'en'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('meta.description'))
  }, [lang, t])

  const handleLangChange = (newLang: Lang) => {
    i18n.changeLanguage(newLang)
  }

  const handleInputChange = (name: keyof Inputs, value: number | boolean) => {
    setInputs(prev => applyInputChange(prev, name, value))
  }

  const handleCalculate = () => {
    const result = calculate(inputs, mode)
    setResults(result)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, SCROLL_DELAY_MS)
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        {t('a11y.skipToMain')}
      </a>
      <Header lang={lang} onLangChange={handleLangChange} />

      <main className="main" id="main-content">
        <div className="container">
          <ModeToggle mode={mode} onModeChange={setMode} />

          <InputPanel inputs={inputs} onInputChange={handleInputChange} mode={mode} />

          <div className="calculate-section">
            <button type="button" className="calculate-btn" onClick={handleCalculate}>
              <span>{results ? t('recalculate') : t('calculate')} →</span>
            </button>
          </div>

          {results && (
            <div className="results-section" ref={resultsRef}>
              <SplitResults results={results} years={inputs.years} />
              <Charts yearlyData={results.yearlyData} breakevenYear={results.breakevenYear} />
              <Recommendation results={results} years={inputs.years} />
              <Suspense fallback={null}>
                <CalculationBreakdown results={results} inputs={inputs} mode={mode} />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <span>{APP_NAME}</span>
        <span className="footer-dot" />
        <span>{new Date().getFullYear()}</span>
        <span className="footer-dot" />
        <span>{t('footer.disclaimer')}</span>
      </footer>
    </div>
  )
}
