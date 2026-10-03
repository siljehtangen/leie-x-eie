import { lazy, Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useFormatNOK } from '../hooks/useFormatNOK'
import { useLocale } from '../hooks/useLocale'
import { buildBreakdownModel, buildTaxRuleParams } from '../utils/breakdownModel'
import { formatPercent } from '../utils/formatting'
import type { CalculationResult, Inputs, Mode } from '../types'
import BuyerColumn from './breakdown/BuyerColumn'
import RenterColumn from './breakdown/RenterColumn'
import YearlyTable from './breakdown/YearlyTable'

const PdfDownload = lazy(() => import('./PdfDownload'))

interface CalculationBreakdownProps {
  results: CalculationResult
  inputs: Inputs
  mode: Mode
}

export default function CalculationBreakdown({ results, inputs, mode }: CalculationBreakdownProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const formatKr = useFormatNOK()
  const locale = useLocale()

  const model = useMemo(() => buildBreakdownModel(results, inputs, mode), [results, inputs, mode])
  const rules = useMemo(() => buildTaxRuleParams(locale, formatKr), [locale, formatKr])
  const { isAdvanced } = model
  const perMonth = `/${t('breakdown.month')}`
  const perYear = ` ${t('units.perYear')}`
  const years = (n: number) => `${n} ${t('units.years')}`
  const pct = (v: number) => formatPercent(v, locale)

  return (
    <div className="breakdown-wrap">
      <button
        type="button"
        className={`breakdown-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{t('breakdown.title')}</span>
        <ChevronDown size={15} className={`breakdown-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="breakdown-panel" role="region" aria-label={t('breakdown.title')}>
          <div className="breakdown-download-row">
            <Suspense fallback={<span className="breakdown-download-btn" aria-busy>{t('breakdown.generating')}</span>}>
              <PdfDownload results={results} inputs={inputs} model={model} rules={rules} locale={locale} />
            </Suspense>
          </div>

          <div className="bd-section">
            <h3 className="bd-section-title">{t('breakdown.inputs')}</h3>
            <div className="bd-input-grid">
              {[
                [t('inputs.purchasePrice'), formatKr(inputs.purchasePrice)],
                [t('inputs.downPayment'), formatKr(inputs.downPayment)],
                [t('breakdown.loanAmount'), formatKr(model.mortgage.loanAmount)],
                [t('inputs.mortgageRate'), pct(inputs.mortgageRate)],
                [t('inputs.loanTermYears'), years(inputs.loanTermYears)],
                [t('inputs.monthlyHoaFee'), `${formatKr(inputs.monthlyHoaFee)}${perMonth}`],
                [t('inputs.hoaFeeIncrease'), pct(inputs.hoaFeeIncrease)],
                [t('inputs.stampDuty'), formatKr(model.stampDuty)],
                [t('inputs.monthlyRent'), `${formatKr(inputs.monthlyRent)}${perMonth}`],
                [t('inputs.rentIncrease'), pct(inputs.rentIncrease)],
                [t('inputs.appreciationRate'), pct(inputs.appreciationRate)],
                [t('inputs.years'), years(model.years)],
                [t('inputs.inflation'), pct(inputs.inflation)],
                ...(isAdvanced ? [] : [[t('inputs.investmentReturn'), pct(inputs.investmentReturn)]]),
                [t('inputs.brokerSellingFee'), formatKr(inputs.brokerSellingFee)],
                ...(model.mortgage.ioYears > 0
                  ? [[t('inputs.interestOnlyYears'), years(model.mortgage.ioYears)]]
                  : []),
                ...(inputs.householdIncome > 0
                  ? [[t('inputs.householdIncome'), `${formatKr(inputs.householdIncome)}${perYear}`]]
                  : []),
                ...(isAdvanced && inputs.rentalIncome > 0
                  ? [[t('inputs.rentalIncome'), `${formatKr(inputs.rentalIncome)}${perMonth}`]]
                  : []),
              ].map(([label, val]) => (
                <div key={label} className="bd-input-row">
                  <span className="bd-input-label">{label}</span>
                  <span className="bd-input-value">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bd-two-col">
            <BuyerColumn t={t} formatKr={formatKr} locale={locale} inputs={inputs} model={model} rules={rules} />
            <RenterColumn t={t} formatKr={formatKr} locale={locale} inputs={inputs} model={model} rules={rules} />
          </div>

          <YearlyTable t={t} formatKr={formatKr} yearlyData={results.yearlyData} />
        </div>
      )}
    </div>
  )
}
