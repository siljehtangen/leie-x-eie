import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { computeAffordability } from '../utils/affordability'
import { stressTestRate } from '../utils/calculations'
import { useFormatNOK } from '../hooks/useFormatNOK'
import { useLocale } from '../hooks/useLocale'
import { formatPct, formatPercent } from '../utils/formatting'
import { MAX_DEBT_TO_INCOME } from '../constants/finance'
import type { Inputs, Mode } from '../types'

interface AffordabilityProps {
  inputs: Inputs
  mode: Mode
}

export default function Affordability({ inputs, mode }: AffordabilityProps) {
  const { t } = useTranslation()
  const formatKr = useFormatNOK()
  const locale = useLocale()
  const result = useMemo(() => computeAffordability(inputs, mode), [inputs, mode])
  if (!result) return null

  const ok = !result.exceedsLimit
  const Icon = ok ? CircleCheck : TriangleAlert

  return (
    <section className={`affordability ${ok ? 'ok' : 'over'}`} aria-labelledby="affordability-title">
      <div className="affordability-head">
        <Icon size={20} strokeWidth={2} aria-hidden />
        <h3 id="affordability-title" className="affordability-title">
          {t(ok ? 'affordability.titleOk' : 'affordability.titleOver')}
        </h3>
      </div>
      <dl className="affordability-stats">
        <div>
          <dt>{t('affordability.totalDebt')}</dt>
          <dd>{formatKr(result.totalDebt)}</dd>
        </div>
        <div>
          <dt>{t('affordability.debtToIncome')}</dt>
          <dd>
            {t('affordability.times', { value: formatPct(result.debtToIncome, locale, 1) })}
            <span className="affordability-sub">
              {t('affordability.limit', { max: MAX_DEBT_TO_INCOME, amount: formatKr(result.maxDebt) })}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t('affordability.stressed', { rate: formatPct(stressTestRate(inputs.mortgageRate), locale) })}</dt>
          <dd>
            {formatKr(result.stressedMonthlyPayment)} {t('units.perMonth')}
            <span className="affordability-sub">
              {t('affordability.shareOfIncome', { pct: formatPercent(result.stressedShareOfIncome * 100, locale, 0) })}
            </span>
          </dd>
        </div>
      </dl>
      <p className="affordability-note">
        {t(ok ? 'affordability.noteOk' : 'affordability.noteOver', {
          max: MAX_DEBT_TO_INCOME,
          over: formatKr(result.totalDebt - result.maxDebt),
        })}
      </p>
    </section>
  )
}
