import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import ModeToggle from './components/ModeToggle'
import InputPanel from './components/InputPanel'
import SplitResults from './components/SplitResults'
import Charts from './components/Charts'
import Recommendation from './components/Recommendation'
import { calculate } from './utils/calculations'

const DEFAULT_INPUTS = {
  // Quick – Rent
  monthlyRent: 12000,
  // Quick – Buy
  purchasePrice: 4000000,
  downPayment: 600000,
  mortgageRate: 5.5,
  loanTermYears: 25,
  monthlyHoaFee: 3000,
  stampDuty: 100000,
  brokerSellingFee: 100000,
  // Quick – Time & Market
  years: 10,
  appreciationRate: 2.5,
  rentGrowth: 2,
  investmentReturn: 5,
  // Advanced – Rent extras
  contentsInsurance: 2400,
  electricity: 12000,
  internet: 6000,
  parking: 0,
  // Advanced – Buy extras
  otherClosingCosts: 5000,
  sharedDebt: 0,
  municipalFees: 8000,
  renovationPct: 1,
  homeInsurance: 5000,
  propertyTax: 0,
  hoaFeeIncrease: 3,
  // Advanced – Financial
  interestDeduction: 22,
  inflation: 2.5,
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState('no')
  const [mode, setMode] = useState('quick')
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)
  const [results, setResults] = useState(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    document.title = t('header.pageTitle')
  }, [lang, t])

  const handleLangChange = (newLang) => {
    setLang(newLang)
    i18n.changeLanguage(newLang)
  }

  const handleInputChange = (name, value) => {
    setInputs(prev => {
      const next = { ...prev, [name]: value }
      // Auto-update dokumentavgift when purchasePrice changes,
      // unless the user has manually set it to something other than the standard 2.5%
      if (name === 'purchasePrice' && prev.stampDuty === Math.round(prev.purchasePrice * 0.025)) {
        next.stampDuty = Math.round(value * 0.025)
      }
      if (name === 'purchasePrice' && prev.downPayment === Math.round(prev.purchasePrice * 0.15)) {
        next.downPayment = Math.round(value * 0.15)
      }
      return next
    })
  }

  const handleCalculate = () => {
    const result = calculate(inputs, mode)
    setResults(result)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <div className="app">
      <Header lang={lang} onLangChange={handleLangChange} />

      <main className="main">
        <div className="container">
          <ModeToggle mode={mode} onModeChange={setMode} />

          <InputPanel inputs={inputs} onInputChange={handleInputChange} mode={mode} />

          <div className="calculate-section">
            <button className="calculate-btn" onClick={handleCalculate}>
              <span>{results ? t('recalculate') : t('calculate')} →</span>
            </button>
          </div>

          {results && (
            <div className="results-section" ref={resultsRef}>
              <SplitResults results={results} years={inputs.years} />
              <Charts yearlyData={results.yearlyData} breakevenYear={results.breakevenYear} />
              <Recommendation results={results} years={inputs.years} />
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <span>DeciDwell</span>
        <span className="footer-dot" />
        <span>{new Date().getFullYear()}</span>
        <span className="footer-dot" />
        <span>For educational purposes only</span>
      </footer>
    </div>
  )
}
