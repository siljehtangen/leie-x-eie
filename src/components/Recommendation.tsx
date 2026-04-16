import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { formatNOK, getLocale } from '../utils/calculations'
import type { CalculationResult } from '../types'

interface RecommendationProps {
  results: CalculationResult
  years: number
}

export default function Recommendation({ results, years }: RecommendationProps) {
  const { t, i18n } = useTranslation()
  const { recommendation, difference, summary, breakevenYear } = results
  const isBuy = recommendation === 'buy'
  const locale = getLocale(i18n.language)

  const diffFormatted = formatNOK(difference, false, locale)
  const equityFormatted = formatNOK(summary.finalEquity, false, locale)
  const portfolioFormatted = formatNOK(summary.finalRenterPortfolio, false, locale)

  const mortgageDiff = summary.initialBuyerMonthly - summary.initialMonthlyRent
  const buyingCostsMore = mortgageDiff > 0

  const breakevenText = breakevenYear !== null
    ? t('recommendation.breakevenAt', { year: breakevenYear })
    : isBuy
      ? t('recommendation.noBreakevenBuy', { years })
      : t('recommendation.noBreakevenRent', { years })

  const breakevenValue = breakevenYear !== null
    ? `${t('recommendation.year')} ${breakevenYear}`
    : t('recommendation.notApplicable')

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
            ? t('recommendation.buyDesc', { amount: diffFormatted, years, equity: equityFormatted, portfolio: portfolioFormatted })
            : t('recommendation.rentDesc', { amount: diffFormatted, years, equity: equityFormatted, portfolio: portfolioFormatted })}
        </p>

        <p className="rec-breakeven-note">{breakevenText}</p>

        <div className="rec-metrics">
          <div className="rec-metric">
            <div className="rec-metric-label">
              {buyingCostsMore
                ? t('recommendation.buyingCostsMore')
                : t('recommendation.rentingCostsMore')}
            </div>
            <div className="rec-metric-value">
              {formatNOK(Math.abs(mortgageDiff), false, locale)} {t('units.perMonth')}
            </div>
          </div>
          <div className="rec-metric">
            <div className="rec-metric-label">{t('recommendation.equityBuilt', { years })}</div>
            <div className="rec-metric-value">{equityFormatted}</div>
          </div>
          <div className="rec-metric">
            <div className="rec-metric-label">{t('recommendation.investmentGrowth', { years })}</div>
            <div className="rec-metric-value">{portfolioFormatted}</div>
          </div>
          <div className="rec-metric">
            <div className="rec-metric-label">{t('recommendation.breakevenYear')}</div>
            <div className="rec-metric-value">{breakevenValue}</div>
          </div>
        </div>

        <p className="rec-real-terms">{t('recommendation.realTermsNote')}</p>
      </div>

      <p className="rec-disclaimer">
        <Info size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: '#9E9E9E' }} aria-hidden />
        {t('recommendation.disclaimer')}
      </p>
    </div>
  )
}
