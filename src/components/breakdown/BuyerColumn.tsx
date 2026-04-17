import { INTEREST_DEDUCTION } from '../../constants/finance'
import type { Inputs, Summary, YearlyDataPoint } from '../../types'

type FormatFn = (value: number, compact?: boolean) => string
type TFn = (key: string, opts?: Record<string, unknown>) => string

export interface BuyerColumnProps {
  t: TFn
  formatKr: FormatFn
  inputs: Inputs
  summary: Summary
  yearlyData: YearlyDataPoint[]
  isAdvanced: boolean
  finalYear: YearlyDataPoint
}

export default function BuyerColumn({ t, formatKr, inputs, summary, yearlyData, isAdvanced, finalYear }: BuyerColumnProps) {
  const {
    loanAmount, monthlyRate, numPayments: n, ioYears,
    remainingTermMonths, monthlyAmortizingPayment, finalInflationFactor: inflationFactor,
  } = summary

  return (
    <div className="bd-col bd-col-buy">
      <h3 className="bd-col-title">{t('breakdown.buyerCalc')}</h3>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.loanAmount')}</div>
        <div className="bd-formula-line">
          {formatKr(inputs.purchasePrice)} − {formatKr(inputs.downPayment)} = <strong>{formatKr(loanAmount)}</strong>
        </div>
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.monthlyMortgageCalc')}</div>
        <div className="bd-formula-line">
          r = {inputs.mortgageRate}% ÷ 12 = {(monthlyRate * 100).toFixed(4)}% / {t('breakdown.month')}
        </div>
        <div className="bd-formula-line">
          n = {inputs.loanTermYears} × 12 = {n} {t('breakdown.payments')}
        </div>
        {ioYears > 0 ? (
          <>
            <div className="bd-formula-line bd-formula-note">
              {t('breakdown.ioPhase', { years: ioYears })}
            </div>
            <div className="bd-formula-line bd-formula-eq">
              {t('breakdown.payment')} = L × r = {formatKr(loanAmount * monthlyRate)} / {t('breakdown.month')}
            </div>
            <div className="bd-formula-line bd-formula-note">
              {t('breakdown.amortizingPhase', { from: ioYears + 1, months: remainingTermMonths })}
            </div>
            <div className="bd-formula-line bd-formula-eq">
              {t('breakdown.payment')} = L × r(1+r)^n / ((1+r)^n − 1)
            </div>
            <div className="bd-formula-result bd-result-buy">
              → {formatKr(monthlyAmortizingPayment)} / {t('breakdown.month')}
            </div>
          </>
        ) : (
          <>
            <div className="bd-formula-line bd-formula-eq">
              {t('breakdown.payment')} = L × r(1+r)^n / ((1+r)^n − 1)
            </div>
            <div className="bd-formula-result bd-result-buy">
              → {formatKr(summary.monthlyMortgagePayment)} / {t('breakdown.month')}
            </div>
          </>
        )}
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.year1MonthlyCost')}</div>
        <div className="bd-cost-table">
          <div className="bd-cost-row">
            <span>{t('breakdown.mortgagePayment')}</span>
            <span>+ {formatKr(summary.monthlyMortgagePayment)}</span>
          </div>
          <div className="bd-cost-row alt">
            <span>{t('inputs.monthlyHoaFee')}</span>
            <span>+ {formatKr(inputs.monthlyHoaFee)}</span>
          </div>
          <div className="bd-cost-row deduction">
            <span>{t('breakdown.interestDeduction')} ({(INTEREST_DEDUCTION * 100).toFixed(0)}%)</span>
            <span>− {formatKr((loanAmount * monthlyRate + (isAdvanced ? inputs.sharedDebt * inputs.sharedDebtRate / 100 / 12 : 0)) * INTEREST_DEDUCTION)}</span>
          </div>
          {isAdvanced && (inputs.electricity > 0 || inputs.internet > 0) && (
            <div className="bd-cost-row alt">
              <span>{t('inputs.electricity')} & {t('inputs.internet')}</span>
              <span>+ {formatKr((inputs.electricity + inputs.internet) / 12)}</span>
            </div>
          )}
          {isAdvanced && inputs.renovationPct > 0 && (
            <div className="bd-cost-row">
              <span>{t('inputs.renovationPct')}</span>
              <span>+ {formatKr(inputs.purchasePrice * inputs.renovationPct / 100 / 12)}</span>
            </div>
          )}
          {isAdvanced && inputs.municipalFees > 0 && (
            <div className="bd-cost-row alt">
              <span>{t('inputs.municipalFees')}</span>
              <span>+ {formatKr(inputs.municipalFees / 12)}</span>
            </div>
          )}
          {isAdvanced && inputs.homeInsurance > 0 && (
            <div className="bd-cost-row">
              <span>{t('inputs.homeInsurance')}</span>
              <span>+ {formatKr(inputs.homeInsurance / 12)}</span>
            </div>
          )}
          {isAdvanced && inputs.propertyTax > 0 && (
            <div className="bd-cost-row alt">
              <span>{t('inputs.propertyTax')}</span>
              <span>+ {formatKr(inputs.propertyTax / 12)}</span>
            </div>
          )}
          <div className="bd-cost-row total-buy">
            <span>{t('breakdown.totalMonthly')}</span>
            <span>{formatKr(yearlyData[0].buyerMonthlyCost)}</span>
          </div>
        </div>
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.buyerNetWorth')} ({inputs.years} {t('units.years')})</div>
        <div className="bd-formula-line">
          {t('breakdown.homeValue')}: {formatKr(finalYear.homeValue)}
        </div>
        <div className="bd-formula-line">
          − {t('breakdown.remainingMortgage')}: {formatKr(finalYear.remainingMortgage)}
        </div>
        {inputs.sharedDebt > 0 && (
          <div className="bd-formula-line">
            − {t('inputs.sharedDebt')}: {formatKr(inputs.sharedDebt)}
          </div>
        )}
        <div className="bd-formula-line">
          − {t('inputs.brokerSellingFee')}: {formatKr(inputs.brokerSellingFee)}
        </div>
        {isAdvanced && finalYear.cumulativeBuyerWealthTax > 0 && (
          <div className="bd-formula-line">
            − {t('breakdown.accumulatedWealthTax')}: {formatKr(finalYear.cumulativeBuyerWealthTax)}
          </div>
        )}
        <div className="bd-formula-line">
          ÷ {t('breakdown.inflationFactor')} ({inputs.inflation}%): {inflationFactor.toFixed(3)}
        </div>
        <div className="bd-formula-note" style={{ marginTop: '0.3rem' }}>
          {t('breakdown.taxFreeHomeSale')}
        </div>
        <div className="bd-formula-result bd-result-buy">
          = {formatKr(summary.finalEquity)}
        </div>
      </div>
    </div>
  )
}
