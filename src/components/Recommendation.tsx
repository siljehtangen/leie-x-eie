import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { formatNOK } from '../utils/calculations'
import type { CalculationResult } from '../types'

interface RecommendationProps {
  results: CalculationResult
  years: number
}

export default function Recommendation({ results, years }: RecommendationProps) {
  const { t } = useTranslation()
  const { recommendation, difference, summary } = results
  const isBuy = recommendation === 'buy'

  const diffFormatted = formatNOK(difference)
  const mortgageDiff = summary.monthlyMortgagePayment - summary.initialMonthlyRent

  return (
    <div className="recommendation-section">
      <div className={`recommendation-card ${recommendation}`}>
        <div className="rec-bg-shape rec-bg-1" />
        <div className="rec-bg-shape rec-bg-2" />

        <div className="rec-label">
          {t('recommendation.keyFactors')} — {years} {t('results.years')}
        </div>

        <h2 className="rec-title">
          {isBuy ? t('recommendation.buy') : t('recommendation.rent')}
        </h2>

        <div className="rec-amount">{diffFormatted}</div>

        <p className="rec-desc">
          {isBuy
            ? t('recommendation.buyDesc',  { amount: diffFormatted, years })
            : t('recommendation.rentDesc', { amount: diffFormatted, years })}
        </p>

        <div className="rec-metrics">
          <div className="rec-metric">
            <div className="rec-metric-label">{t('recommendation.mortgageVsRent')}</div>
            <div className="rec-metric-value">
              {mortgageDiff > 0
                ? `+${formatNOK(mortgageDiff)} / mnd`
                : `${formatNOK(mortgageDiff)} / mnd`}
            </div>
          </div>
          <div className="rec-metric">
            <div className="rec-metric-label">{t('recommendation.equityBuilt')}</div>
            <div className="rec-metric-value">{formatNOK(summary.finalEquity)}</div>
          </div>
          <div className="rec-metric">
            <div className="rec-metric-label">{t('recommendation.investmentGrowth')}</div>
            <div className="rec-metric-value">{formatNOK(summary.finalRenterPortfolio)}</div>
          </div>
        </div>
      </div>

      <p className="rec-disclaimer">
        <Info size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: '#9E9E9E' }} />
        {t('recommendation.disclaimer')}
      </p>
    </div>
  )
}
