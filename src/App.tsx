import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import ModeToggle from './components/ModeToggle'
import InputPanel from './components/InputPanel'
import SplitResults from './components/SplitResults'
import Charts from './components/Charts'
import Recommendation from './components/Recommendation'
import { calculate, normalizeInputs } from './utils/calculations'
import { applyInputChange } from './utils/inputUpdates'
import { clearScenario, loadScenario, saveScenario } from './utils/scenarioStorage'
import { DEFAULT_INPUTS } from './constants/defaults'
import { APP_NAME, SCROLL_DELAY_MS } from './constants/app'
import type { Inputs, Mode, Lang, CalculationResult } from './types'

const CalculationBreakdown = lazy(() => import('./components/CalculationBreakdown'))

interface CalculationSnapshot {
  result: CalculationResult
  inputs: Inputs
  mode: Mode
}

function resolveLang(language: string): Lang {
  return language.startsWith('en') ? 'en' : 'no'
}

export default function App() {
  const { t, i18n } = useTranslation()
  const lang = resolveLang(i18n.language)
  const [initialScenario] = useState(() => loadScenario())
  const [mode, setMode] = useState<Mode>(initialScenario?.mode ?? 'quick')
  const [inputs, setInputs] = useState<Inputs>(initialScenario?.inputs ?? DEFAULT_INPUTS)
  const [snapshot, setSnapshot] = useState<CalculationSnapshot | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = t('header.pageTitle')
  }, [t])

  useEffect(() => {
    document.documentElement.lang = lang === 'no' ? 'nb' : 'en'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('meta.description'))
  }, [lang, t])

  useEffect(() => {
    saveScenario({ mode, inputs })
  }, [mode, inputs])

  const handleLangChange = (newLang: Lang) => {
    i18n.changeLanguage(newLang)
  }

  const handleInputChange = (name: keyof Inputs, value: number | boolean) => {
    setInputs(prev => applyInputChange(prev, name, value))
  }

  const handleCalculate = () => {
    const normalized = normalizeInputs(inputs)
    setSnapshot({ result: calculate(normalized, mode), inputs: normalized, mode })
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, SCROLL_DELAY_MS)
  }

  const handleReset = () => {
    clearScenario()
    setInputs(DEFAULT_INPUTS)
    setSnapshot(null)
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
              <span>{snapshot ? t('recalculate') : t('calculate')} →</span>
            </button>
            <button type="button" className="reset-btn" onClick={handleReset}>
              {t('resetInputs')}
            </button>
          </div>

          {snapshot && (
            <div className="results-section" ref={resultsRef}>
              <SplitResults results={snapshot.result} years={snapshot.inputs.years} />
              <Charts yearlyData={snapshot.result.yearlyData} breakevenYear={snapshot.result.breakevenYear} />
              <Recommendation results={snapshot.result} years={snapshot.inputs.years} />
              <Suspense fallback={null}>
                <CalculationBreakdown results={snapshot.result} inputs={snapshot.inputs} mode={snapshot.mode} />
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
