import type { Inputs, FormatKrFn, TranslateFn } from '../../types'
import type { BreakdownModel, TaxRuleParams } from '../../utils/breakdownModel'
import { formatDecimal, formatPct, formatPercent } from '../../utils/formatting'

export interface BuyerColumnProps {
  t: TranslateFn
  formatKr: FormatKrFn
  locale: string
  inputs: Inputs
  model: BreakdownModel
  rules: TaxRuleParams
}

export default function BuyerColumn({ t, formatKr, locale, inputs, model, rules }: BuyerColumnProps) {
  const { mortgage, inflationFactor } = model
  const perMonth = `/ ${t('breakdown.month')}`
  const monthlyRatePct = formatPercent(mortgage.monthlyRate * 100, locale, 4)

  return (
    <div className="bd-col bd-col-buy">
      <h3 className="bd-col-title">{t('breakdown.buyerCalc')}</h3>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.loanAmount')}</div>
        <div className="bd-formula-line">
          {formatKr(inputs.purchasePrice)} − {formatKr(inputs.downPayment)} = <strong>{formatKr(mortgage.loanAmount)}</strong>
        </div>
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.monthlyMortgageCalc')}</div>
        <div className="bd-formula-line">
          r = {formatPercent(mortgage.ratePct, locale)} ÷ 12 = {monthlyRatePct} {perMonth}
        </div>
        <div className="bd-formula-line">
          n = {mortgage.loanTermYears} × 12 = {mortgage.numPayments} {t('breakdown.payments')}
        </div>
        {mortgage.ioYears > 0 && (
          <>
            <div className="bd-formula-line bd-formula-note">
              {t('breakdown.ioPhase', { years: mortgage.ioYears })}
            </div>
            <div className="bd-formula-line bd-formula-eq">
              {t('breakdown.payment')} = L × r = {formatKr(mortgage.ioPayment)} {perMonth}
            </div>
            <div className="bd-formula-line bd-formula-note">
              {t('breakdown.amortizingPhase', { from: mortgage.ioYears + 1, months: mortgage.remainingTermMonths })}
            </div>
          </>
        )}
        <div className="bd-formula-line bd-formula-eq">
          {t('breakdown.payment')} = L × r(1+r)^n / ((1+r)^n − 1)
        </div>
        <div className="bd-formula-legend">
          <div className="bd-formula-legend-title">{t('breakdown.formulaWhere')}</div>
          <dl>
            <dt>L</dt>
            <dd>{t('breakdown.formulaL', { amount: formatKr(mortgage.loanAmount) })}</dd>
            <dt>r</dt>
            <dd>{t('breakdown.formulaR', { rate: monthlyRatePct })}</dd>
            <dt>n</dt>
            <dd>
              {mortgage.ioYears > 0
                ? t('breakdown.formulaNAfterIo', { count: mortgage.remainingTermMonths })
                : t('breakdown.formulaN', { count: mortgage.remainingTermMonths })}
            </dd>
          </dl>
          <p className="bd-formula-note">{t('breakdown.formulaExplainer')}</p>
        </div>
        <div className="bd-formula-result bd-result-buy">
          → {formatKr(mortgage.amortizingPayment)} {perMonth}
        </div>
        {mortgage.rateChange && (
          <div className="bd-formula-line bd-formula-note bd-formula-note-spaced">
            {t('breakdown.rateChangeNote', {
              year: mortgage.rateChange.year,
              rate: formatPct(mortgage.rateChange.ratePct, locale),
              payment: formatKr(mortgage.rateChange.monthlyPayment),
            })}
          </div>
        )}
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.year1MonthlyCost')}</div>
        <div className="bd-cost-table">
          {model.buyerCostLines.map((l, i) => (
            <div
              key={l.id}
              className={`bd-cost-row${l.sign === '−' ? ' deduction' : i % 2 === 1 ? ' alt' : ''}`}
            >
              <span>{t(l.labelKey, l.labelOpts)}</span>
              <span>{l.sign} {formatKr(l.amount)}</span>
            </div>
          ))}
          <div className="bd-cost-row total-buy">
            <span>{t('breakdown.totalMonthly')}</span>
            <span>{formatKr(model.buyerMonthlyTotal)}</span>
          </div>
        </div>
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.buyerNetWorth')} ({model.years} {t('units.years')})</div>
        {model.buyerNetWorthLines.map((l, i) => (
          <div key={l.id} className="bd-formula-line">
            {i > 0 && `${l.sign} `}{t(l.labelKey, { pct: rules.askTax, ...l.labelOpts })}: {formatKr(l.amount)}
          </div>
        ))}
        <div className="bd-formula-line">
          ÷ {t('breakdown.inflationFactor')} ({formatPercent(inputs.inflation, locale)}): {formatDecimal(inflationFactor, locale)}
        </div>
        <div className="bd-formula-note bd-formula-note-spaced">
          {t('breakdown.taxFreeHomeSale')}
        </div>
        <div className="bd-formula-result bd-result-buy">
          = {formatKr(model.buyerNetWorth)}
        </div>
      </div>
    </div>
  )
}
