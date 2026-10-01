import { useTranslation } from 'react-i18next'
import { Trophy, Home, Building2 } from 'lucide-react'
import { AnimatedNOK } from './AnimatedNOK'
import { useLocale } from '../hooks/useLocale'
import { useFormatNOK } from '../hooks/useFormatNOK'
import { formatPct } from '../utils/formatting'
import type { CalculationResult } from '../types'

interface SplitResultsProps {
  results: CalculationResult
  years: number
}

export default function SplitResults({ results, years }: SplitResultsProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const formatKr = useFormatNOK()
  const { summary, recommendation } = results

  const totalBuyOutlay = summary.downPayment + summary.closingCosts

  return (
    <section className="results-block" aria-labelledby="split-heading">
      <div className="results-block-head">
        <div>
          <h3 id="split-heading" className="results-block-title">{t('results.splitTitle')}</h3>
          <p className="results-block-subtitle">{t('results.unitsNote')}</p>
        </div>
      </div>

      <div className="split-screen">
        <div className="split-card rent">
          {recommendation === 'rent' && (
            <div className="winner-badge">
              <Trophy size={12} style={{ display: 'inline', marginRight: 4 }} aria-hidden />
              {t('results.winner')}
            </div>
          )}
          <div className="split-card-badge">
            <Home size={14} strokeWidth={2.5} aria-hidden />
            {t('results.rent')}
          </div>
          <div className="split-card-headline">
            <AnimatedNOK value={summary.initialMonthlyRent} trigger={results} locale={locale} />
          </div>
          <div className="split-card-sub">{t('results.monthlyRentLabel')}</div>
          <div className="split-card-stats">
            <div className="stat-row">
              <span className="stat-label">{t('results.totalPaid')} ({years} {t('results.years')})</span>
              <AnimatedNOK value={summary.totalRenterPaid} trigger={results} locale={locale} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.finalPortfolio')}</span>
              <AnimatedNOK value={summary.finalRenterPortfolio} trigger={results} large locale={locale} />
            </div>
          </div>
        </div>

        <div className="vs-badge-center" aria-hidden>VS</div>

        <div className="split-card buy">
          {recommendation === 'buy' && (
            <div className="winner-badge">
              <Trophy size={12} style={{ display: 'inline', marginRight: 4 }} aria-hidden />
              {t('results.winner')}
            </div>
          )}
          <div className="split-card-badge">
            <Building2 size={14} strokeWidth={2.5} aria-hidden />
            {t('results.buy')}
          </div>
          <div className="split-card-headline">
            <AnimatedNOK value={summary.monthlyMortgagePayment} trigger={results} locale={locale} />
          </div>
          <div className="split-card-sub">{t('results.monthlyMortgage')}</div>
          <div className="split-card-stats">
            <div className="stat-row">
              <span className="stat-label">{t('results.initialOutlay')}</span>
              <AnimatedNOK value={totalBuyOutlay} trigger={results} locale={locale} />
            </div>
            <div className="stat-row" title={t('results.stressTestHint')}>
              <span className="stat-label">
                {t('results.stressTest', { rate: formatPct(summary.stressTest.ratePct, locale) })}
              </span>
              <span className="stat-stack">
                <AnimatedNOK value={summary.stressTest.monthlyPayment} trigger={results} locale={locale} />
                <span className="stat-sub">
                  +{formatKr(summary.stressTest.extraPerMonth)} {t('units.perMonth')}
                </span>
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.totalPaid')} ({years} {t('results.years')})</span>
              <AnimatedNOK value={summary.totalBuyerPaid} trigger={results} locale={locale} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.homeValue')}</span>
              <AnimatedNOK value={summary.finalHomeValue} trigger={results} locale={locale} />
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('results.finalEquity')}</span>
              <AnimatedNOK value={summary.finalEquity} trigger={results} large locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
