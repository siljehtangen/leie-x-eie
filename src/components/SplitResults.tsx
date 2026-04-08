import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy } from 'lucide-react'
import { formatNOK } from '../utils/calculations'
import type { CalculationResult } from '../types'

function useAnimatedValue(target: number, trigger: number): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    setValue(0)
    if (target === 0) return
    const duration = 900
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, trigger])
  return value
}

interface AnimatedNOKProps {
  value: number
  trigger: number
  large?: boolean
}

function AnimatedNOK({ value, trigger, large }: AnimatedNOKProps) {
  const anim = useAnimatedValue(value, trigger)
  return <span className={`stat-value${large ? ' large' : ''}`}>{formatNOK(anim)}</span>
}

interface SplitResultsProps {
  results: CalculationResult
  years: number
}

export default function SplitResults({ results, years }: SplitResultsProps) {
  const { t } = useTranslation()
  const { summary, recommendation } = results
  const [tick, setTick] = useState(0)

  useEffect(() => { setTick(n => n + 1) }, [results])

  const totalBuyOutlay = summary.downPayment + summary.closingCosts

  return (
    <div>
      <h2 className="results-title">{t('results.title')}</h2>

      <div className="split-screen">
        {/* ── RENT CARD ──────────────────────────────────────────────────────── */}
        <div className="split-card rent">
          {recommendation === 'rent' && (
            <div className="winner-badge">
              <Trophy size={12} style={{ display: 'inline', marginRight: 4 }} />
              WINNER
            </div>
          )}
          <div className="split-card-badge">🏠 {t('results.rent')}</div>
          <div className="split-card-headline">
            <AnimatedNOK value={summary.initialMonthlyRent} trigger={tick} />
          </div>
          <div className="split-card-sub">{t('results.monthlyRentLabel')}</div>
          <div className="split-card-divider" />
          <div className="split-card-stats">
            <div className="stat-row">
              <span className="stat-label">{t('results.totalPaid')} ({years} {t('results.years')})</span>
              <AnimatedNOK value={summary.totalRenterPaid} trigger={tick} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.finalPortfolio')}</span>
              <AnimatedNOK value={summary.finalRenterPortfolio} trigger={tick} large />
            </div>
          </div>
        </div>

        <div className="vs-badge-center">VS</div>

        {/* ── BUY CARD ───────────────────────────────────────────────────────── */}
        <div className="split-card buy">
          {recommendation === 'buy' && (
            <div className="winner-badge">
              <Trophy size={12} style={{ display: 'inline', marginRight: 4 }} />
              WINNER
            </div>
          )}
          <div className="split-card-badge">🏡 {t('results.buy')}</div>
          <div className="split-card-headline">
            <AnimatedNOK value={summary.monthlyMortgagePayment} trigger={tick} />
          </div>
          <div className="split-card-sub">{t('results.monthlyMortgage')}</div>
          <div className="split-card-divider" />
          <div className="split-card-stats">
            <div className="stat-row">
              <span className="stat-label">{t('results.initialOutlay')}</span>
              <AnimatedNOK value={totalBuyOutlay} trigger={tick} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.totalPaid')} ({years} {t('results.years')})</span>
              <AnimatedNOK value={summary.totalBuyerPaid} trigger={tick} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.homeValue')}</span>
              <AnimatedNOK value={summary.finalHomeValue} trigger={tick} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.finalEquity')}</span>
              <AnimatedNOK value={summary.finalEquity} trigger={tick} large />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
