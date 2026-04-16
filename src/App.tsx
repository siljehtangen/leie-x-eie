import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import ModeToggle from './components/ModeToggle'
import InputPanel from './components/InputPanel'
import SplitResults from './components/SplitResults'
import Charts from './components/Charts'
import Recommendation from './components/Recommendation'
import CalculationBreakdown from './components/CalculationBreakdown'
import { calculate } from './utils/calculations'
import { BSU_MAX_CONTRIBUTION, STAMP_DUTY_RATE, DEFAULT_DOWN_PAYMENT_RATE } from './constants/finance'
import { APP_NAME, SCROLL_DELAY_MS } from './constants/app'
import type { Inputs, Mode, Lang, CalculationResult } from './types'

const DEFAULT_INPUTS: Inputs = {
  monthlyRent: 12000,
  rentIncrease: 2,
  purchasePrice: 4000000,
  downPayment: 600000,
  mortgageRate: 5.5,
  loanTermYears: 25,
  monthlyHoaFee: 3000,
  stampDuty: 100000,
  brokerSellingFee: 100000,
  years: 10,
  appreciationRate: 2.5,
  investmentReturn: 5,
  contentsInsurance: 2400,
  electricity: 12000,
  internet: 6000,
  parking: 0,
  otherClosingCosts: 5000,
  sharedDebt: 0,
  municipalFees: 8000,
  renovationPct: 1,
  homeInsurance: 5000,
  propertyTax: 0,
  hoaFeeIncrease: 3,
  sharedDebtRate: 5.0,
  interestOnlyYears: 0,
  inflation: 2.5,
  savingsAccountBalance: 200000,
  savingsAccountRate: 4.0,
  askBalance: 400000,
  askRate: 7.0,
  askShieldingRate: 3.0,
  bsuActive: false,
  bsuYearlyContribution: BSU_MAX_CONTRIBUTION,
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState<Lang>('no')
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
    setLang(newLang)
    i18n.changeLanguage(newLang)
  }

  const handleInputChange = (name: keyof Inputs, value: number | boolean) => {
    setInputs(prev => {
      const next: Inputs = { ...prev, [name]: value } as Inputs
      if (name === 'purchasePrice' && typeof value === 'number') {
        if (prev.stampDuty === Math.round(prev.purchasePrice * STAMP_DUTY_RATE)) {
          next.stampDuty = Math.round(value * STAMP_DUTY_RATE)
        }
        if (prev.downPayment === Math.round(prev.purchasePrice * DEFAULT_DOWN_PAYMENT_RATE)) {
          next.downPayment = Math.round(value * DEFAULT_DOWN_PAYMENT_RATE)
        }
      }
      return next
    })
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
              <CalculationBreakdown results={results} inputs={inputs} mode={mode} />
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
