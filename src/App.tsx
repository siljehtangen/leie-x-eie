import { useState, useRef, useEffect, useMemo, useDeferredValue, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowDown } from 'lucide-react'
import Header from './components/Header'
import ModeToggle from './components/ModeToggle'
import CityPresets from './components/CityPresets'
import InputPanel from './components/InputPanel'
import ShareButton from './components/ShareButton'
import SplitResults from './components/SplitResults'
import Charts from './components/Charts'
import Recommendation from './components/Recommendation'
import ScenarioCompare from './components/ScenarioCompare'
import Sensitivity from './components/Sensitivity'
import StickySummary from './components/StickySummary'
import { calculate, normalizeInputs } from './utils/calculations'
import { applyInputChange, applyPreset } from './utils/inputUpdates'
import {
  clearScenario, loadSavedScenarios, loadScenario, saveScenario, storeSavedScenarios,
  type SavedScenario, type Scenario,
} from './utils/scenarioStorage'
import { decodeScenario } from './utils/shareUrl'
import { DEFAULT_INPUTS } from './constants/defaults'
import { APP_NAME, SCROLL_DELAY_MS } from './constants/app'
import { TAX_RULES_YEAR } from './constants/finance'
import type { PresetValues } from './constants/presets'
import type { Inputs, Mode, Lang } from './types'

const CalculationBreakdown = lazy(() => import('./components/CalculationBreakdown'))

function resolveLang(language: string): Lang {
  return language.startsWith('en') ? 'en' : 'no'
}

function readInitialScenario(): { scenario: Scenario | null; fromLink: boolean } {
  const shared = typeof window !== 'undefined' ? decodeScenario(window.location.search) : null
  if (shared) return { scenario: shared, fromLink: true }
  return { scenario: loadScenario(), fromLink: false }
}

function newScenarioId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const { t, i18n } = useTranslation()
  const lang = resolveLang(i18n.language)
  const [initial] = useState(readInitialScenario)
  const [mode, setMode] = useState<Mode>(initial.scenario?.mode ?? 'quick')
  const [inputs, setInputs] = useState<Inputs>(initial.scenario?.inputs ?? DEFAULT_INPUTS)
  const [showResults, setShowResults] = useState(initial.fromLink)
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => loadSavedScenarios())
  const resultsRef = useRef<HTMLDivElement>(null)

  const deferredInputs = useDeferredValue(inputs)
  const deferredMode = useDeferredValue(mode)
  const normalizedInputs = useMemo(() => normalizeInputs(deferredInputs), [deferredInputs])
  const result = useMemo(
    () => (showResults ? calculate(normalizedInputs, deferredMode) : null),
    [showResults, normalizedInputs, deferredMode],
  )
  const currentScenario = useMemo<Scenario>(() => ({ mode, inputs: normalizeInputs(inputs) }), [mode, inputs])
  const displayedScenario = useMemo<Scenario>(
    () => ({ mode: deferredMode, inputs: normalizedInputs }),
    [deferredMode, normalizedInputs],
  )

  useEffect(() => {
    document.title = t('header.pageTitle')
  }, [t])

  useEffect(() => {
    document.documentElement.lang = lang === 'no' ? 'nb' : 'en'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t('meta.description'))
  }, [lang, t])

  useEffect(() => {
    if (initial.fromLink) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  }, [initial.fromLink])

  useEffect(() => {
    saveScenario({ mode, inputs })
  }, [mode, inputs])

  useEffect(() => {
    storeSavedScenarios(savedScenarios)
  }, [savedScenarios])

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, SCROLL_DELAY_MS)
  }

  const handleLangChange = (newLang: Lang) => {
    i18n.changeLanguage(newLang)
  }

  const handleInputChange = (name: keyof Inputs, value: number | boolean) => {
    setInputs(prev => applyInputChange(prev, name, value))
  }

  const handlePreset = (values: PresetValues) => {
    setInputs(prev => applyPreset(prev, values))
  }

  const handleCalculate = () => {
    setShowResults(true)
    scrollToResults()
  }

  const handleReset = () => {
    clearScenario()
    setInputs(DEFAULT_INPUTS)
    setShowResults(false)
  }

  const handleSaveScenario = (name: string) => {
    setSavedScenarios(prev => [...prev, { id: newScenarioId(), name, ...currentScenario }])
  }

  const handleLoadScenario = (scenario: SavedScenario) => {
    setMode(scenario.mode)
    setInputs(scenario.inputs)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id))
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

          <CityPresets inputs={inputs} onApply={handlePreset} />

          <InputPanel inputs={inputs} onInputChange={handleInputChange} mode={mode} />

          <div className="calculate-section">
            <button type="button" className="calculate-btn" onClick={handleCalculate}>
              <span>{showResults ? t('showResults') : t('calculate')}</span>
              <span className="calculate-btn-arrow" aria-hidden>
                {showResults ? <ArrowDown size={16} strokeWidth={2.25} /> : <ArrowRight size={16} strokeWidth={2.25} />}
              </span>
            </button>
            {showResults && <p className="live-hint">{t('liveHint')}</p>}
            <div className="calculate-actions">
              <ShareButton scenario={currentScenario} />
              <button type="button" className="reset-btn" onClick={handleReset}>
                {t('resetInputs')}
              </button>
            </div>
          </div>

          {result && (
            <div className="results-section" ref={resultsRef}>
              <h2 className="results-title">{t('results.title')}</h2>
              <Recommendation results={result} years={normalizedInputs.years} />
              <SplitResults results={result} years={normalizedInputs.years} />
              <Charts
                yearlyData={result.yearlyData}
                breakevenYear={result.breakevenYear}
                inflation={normalizedInputs.inflation}
              />
              <Sensitivity inputs={normalizedInputs} mode={deferredMode} />
              <ScenarioCompare
                current={displayedScenario}
                currentResult={result}
                saved={savedScenarios}
                onSave={handleSaveScenario}
                onLoad={handleLoadScenario}
                onDelete={handleDeleteScenario}
              />
              <Suspense fallback={null}>
                <CalculationBreakdown results={result} inputs={normalizedInputs} mode={deferredMode} />
              </Suspense>
            </div>
          )}
        </div>
        {result && (
          <StickySummary
            result={result}
            years={normalizedInputs.years}
            targetRef={resultsRef}
            onJump={scrollToResults}
          />
        )}
      </main>

      <footer className="footer">
        <span>{APP_NAME}</span>
        <span className="footer-dot" />
        <span>{t('footer.taxYear', { year: TAX_RULES_YEAR })}</span>
        <span className="footer-dot" />
        <span>{t('footer.disclaimer')}</span>
      </footer>
    </div>
  )
}
