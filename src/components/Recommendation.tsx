import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { useFormatNOK } from '../hooks/useFormatNOK'
import { useLocale } from '../hooks/useLocale'
import { computeBreakevenThresholds } from '../utils/breakeven'
import { formatPercent } from '../utils/formatting'
import type { CalculationResult, Inputs, Mode } from '../types'

interface RecommendationProps {
  results: CalculationResult
  inputs: Inputs
  mode: Mode
}

const RENT_ROUNDING = 100

export default function Recommendation({ results, inputs, mode }: RecommendationProps) {
  const { t } = useTranslation()
  const formatKr = useFormatNOK()
  const locale = useLocale()
  const years = inputs.years
  const { recommendation, difference, summary, breakevenYear } = results
  const isBuy = recommendation === 'buy'
  const thresholds = useMemo(() => computeBreakevenThresholds(inputs, mode), [inputs, mode])

  const diffFormatted = formatKr(difference)
  const equityFormatted = formatKr(summary.finalEquity)
  const portfolioFormatted = formatKr(summary.finalRenterPortfolio)

  const monthlyGap = summary.initialBuyerMonthly - summary.year1RenterCosts.total
  const buyingCostsMore = monthlyGap > 0

  const breakevenText =
    breakevenYear !== null
      ? t('recommendation.breakevenAt', { year: breakevenYear })
      : isBuy
        ? t('recommendation.noBreakevenBuy', { years })
        : t('recommendation.noBreakevenRent', { years })

  const breakevenValue =
    breakevenYear !== null ? `${t('recommendation.year')} ${breakevenYear}` : t('recommendation.notApplicable')

  return (
    <div className="recommendation-section">
      <div className={`recommendation-card ${recommendation}`}>
        <div className="rec-bg-shape rec-bg-1" />
        <div className="rec-bg-shape rec-bg-2" />

        <div className="rec-label">
          {t('recommendation.keyFactors')} – {years} {t('results.years')}
        </div>

        <h3 className="rec-title">{isBuy ? t('recommendation.buy') : t('recommendation.rent')}</h3>

        <div className="rec-amount">{diffFormatted}</div>

        <p className="rec-desc">
          {isBuy
            ? t('recommendation.buyDesc', {
                amount: diffFormatted,
                years,
                equity: equityFormatted,
                portfolio: portfolioFormatted,
              })
            : t('recommendation.rentDesc', {
                amount: diffFormatted,
                years,
                equity: equityFormatted,
                portfolio: portfolioFormatted,
              })}
        </p>

        <p className="rec-breakeven-note">{breakevenText}</p>

        {(thresholds.monthlyRent !== null || thresholds.appreciationRate !== null) && (
          <ul className="rec-thresholds" aria-label={t('recommendation.thresholdsLabel')}>
            {thresholds.monthlyRent !== null && (
              <li>
                {t('recommendation.thresholdRent', {
                  amount: formatKr(Math.ceil(thresholds.monthlyRent / RENT_ROUNDING) * RENT_ROUNDING),
                  current: formatKr(inputs.monthlyRent),
                })}
              </li>
            )}
            {thresholds.appreciationRate !== null && (
              <li>
                {t('recommendation.thresholdAppreciation', {
                  rate: formatPercent(thresholds.appreciationRate, locale, 1),
                  current: formatPercent(inputs.appreciationRate, locale, 1),
                })}
              </li>
            )}
          </ul>
        )}

        <div className="rec-metrics">
          <div className="rec-metric">
            <div className="rec-metric-label">
              {buyingCostsMore ? t('recommendation.buyingCostsMore') : t('recommendation.rentingCostsMore')}
            </div>
            <div className="rec-metric-value">
              {formatKr(Math.abs(monthlyGap))} {t('units.perMonth')}
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
        <Info
          size={13}
          style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: 'var(--color-text-muted)' }}
          aria-hidden
        />
        {t('recommendation.disclaimer')}
      </p>
    </div>
  )
}
