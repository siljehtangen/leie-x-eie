import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Download } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { formatNOK } from '../utils/calculations'
import type { CalculationResult, Inputs, Mode } from '../types'
import CalculationPDF from './CalculationPDF'

interface Props {
  results: CalculationResult
  inputs: Inputs
  mode: Mode
}

export default function CalculationBreakdown({ results, inputs, mode }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const { summary, yearlyData } = results
  const loanAmount = inputs.purchasePrice - inputs.downPayment
  const monthlyRate = inputs.mortgageRate / 100 / 12
  const n = inputs.loanTermYears * 12
  const ioYears = mode === 'advanced' ? Math.min(inputs.interestOnlyYears ?? 0, inputs.loanTermYears - 1) : 0
  const remainingTermMonths = n - ioYears * 12
  const monthlyAmortizingPayment =
    remainingTermMonths > 0
      ? monthlyRate > 0
        ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, remainingTermMonths)) / (Math.pow(1 + monthlyRate, remainingTermMonths) - 1)
        : loanAmount / remainingTermMonths
      : 0
  const initialInvestment = inputs.downPayment + summary.closingCosts
  const finalYear = yearlyData[inputs.years - 1]
  const inflationFactor = Math.pow(1 + inputs.inflation / 100, inputs.years)

  return (
    <div className="breakdown-wrap">
      <button
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
            <PDFDownloadLink
              document={<CalculationPDF results={results} inputs={inputs} mode={mode} title={t('breakdown.pdfDocTitle')} />}
              fileName={t('breakdown.pdfFileName')}
              className="breakdown-download-btn"
            >
              {({ loading }) => (
                <>
                  <Download size={13} />
                  <span>{loading ? t('breakdown.generating') : t('breakdown.download')}</span>
                </>
              )}
            </PDFDownloadLink>
          </div>

          <div className="bd-section">
            <h3 className="bd-section-title">{t('breakdown.inputs')}</h3>
            <div className="bd-input-grid">
              {[
                [t('inputs.purchasePrice'), formatNOK(inputs.purchasePrice)],
                [t('inputs.downPayment'), formatNOK(inputs.downPayment)],
                [t('breakdown.loanAmount'), formatNOK(loanAmount)],
                [t('inputs.mortgageRate'), `${inputs.mortgageRate}%`],
                [t('inputs.loanTermYears'), `${inputs.loanTermYears} ${t('units.years')}`],
                [t('inputs.monthlyHoaFee'), `${formatNOK(inputs.monthlyHoaFee)}/${t('breakdown.month')}`],
                [t('inputs.monthlyRent'), `${formatNOK(inputs.monthlyRent)}/${t('breakdown.month')}`],
                [t('inputs.rentIncrease'), `${inputs.rentIncrease}%`],
                [t('inputs.appreciationRate'), `${inputs.appreciationRate}%`],
                [t('inputs.years'), `${inputs.years} ${t('units.years')}`],
                mode === 'advanced'
                  ? [t('inputs.inflation'), `${inputs.inflation}%`]
                  : [t('inputs.investmentReturn'), `${inputs.investmentReturn}%`],
                [t('inputs.brokerSellingFee'), formatNOK(inputs.brokerSellingFee)],
                ...(mode === 'advanced' && inputs.interestOnlyYears > 0
                  ? [[t('inputs.interestOnlyYears'), `${inputs.interestOnlyYears} ${t('units.years')}`]]
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
            <div className="bd-col bd-col-buy">
              <h3 className="bd-col-title">{t('breakdown.buyerCalc')}</h3>

              <div className="bd-formula-block">
                <div className="bd-formula-title">{t('breakdown.loanAmount')}</div>
                <div className="bd-formula-line">
                  {formatNOK(inputs.purchasePrice)} − {formatNOK(inputs.downPayment)} = <strong>{formatNOK(loanAmount)}</strong>
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
                      Betaling = L × r = {formatNOK(loanAmount * monthlyRate)} / {t('breakdown.month')}
                    </div>
                    <div className="bd-formula-line bd-formula-note">
                      {t('breakdown.amortizingPhase', { from: ioYears + 1, months: remainingTermMonths })}
                    </div>
                    <div className="bd-formula-line bd-formula-eq">
                      Betaling = L × r(1+r)^n / ((1+r)^n − 1)
                    </div>
                    <div className="bd-formula-result bd-result-buy">
                      → {formatNOK(monthlyAmortizingPayment)} / {t('breakdown.month')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bd-formula-line bd-formula-eq">
                      Betaling = L × r(1+r)^n / ((1+r)^n − 1)
                    </div>
                    <div className="bd-formula-result bd-result-buy">
                      → {formatNOK(summary.monthlyMortgagePayment)} / {t('breakdown.month')}
                    </div>
                  </>
                )}
              </div>

              <div className="bd-formula-block">
                <div className="bd-formula-title">{t('breakdown.year1MonthlyCost')}</div>
                <div className="bd-cost-table">
                  <div className="bd-cost-row">
                    <span>{t('breakdown.mortgagePayment')}</span>
                    <span>+ {formatNOK(summary.monthlyMortgagePayment)}</span>
                  </div>
                  <div className="bd-cost-row alt">
                    <span>{t('inputs.monthlyHoaFee')}</span>
                    <span>+ {formatNOK(inputs.monthlyHoaFee)}</span>
                  </div>
                  {mode === 'advanced' && (
                    <div className="bd-cost-row deduction">
                      <span>{t('breakdown.interestDeduction')} (22%)</span>
                      <span>− {formatNOK((loanAmount * monthlyRate + inputs.sharedDebt * inputs.sharedDebtRate / 100 / 12) * 0.22)}</span>
                    </div>
                  )}
                  {mode === 'advanced' && (inputs.electricity > 0 || inputs.internet > 0) && (
                    <div className="bd-cost-row alt">
                      <span>{t('inputs.electricity')} & {t('inputs.internet')}</span>
                      <span>+ {formatNOK((inputs.electricity + inputs.internet) / 12)}</span>
                    </div>
                  )}
                  {mode === 'advanced' && inputs.renovationPct > 0 && (
                    <div className="bd-cost-row">
                      <span>{t('inputs.renovationPct')}</span>
                      <span>+ {formatNOK(inputs.purchasePrice * inputs.renovationPct / 100 / 12)}</span>
                    </div>
                  )}
                  {mode === 'advanced' && inputs.municipalFees > 0 && (
                    <div className="bd-cost-row alt">
                      <span>{t('inputs.municipalFees')}</span>
                      <span>+ {formatNOK(inputs.municipalFees / 12)}</span>
                    </div>
                  )}
                  {mode === 'advanced' && inputs.homeInsurance > 0 && (
                    <div className="bd-cost-row">
                      <span>{t('inputs.homeInsurance')}</span>
                      <span>+ {formatNOK(inputs.homeInsurance / 12)}</span>
                    </div>
                  )}
                  {mode === 'advanced' && inputs.propertyTax > 0 && (
                    <div className="bd-cost-row alt">
                      <span>{t('inputs.propertyTax')}</span>
                      <span>+ {formatNOK(inputs.propertyTax / 12)}</span>
                    </div>
                  )}
                  <div className="bd-cost-row total-buy">
                    <span>{t('breakdown.totalMonthly')}</span>
                    <span>{formatNOK(yearlyData[0].buyerMonthlyCost)}</span>
                  </div>
                </div>
              </div>

              <div className="bd-formula-block">
                <div className="bd-formula-title">{t('breakdown.buyerNetWorth')} (år {inputs.years})</div>
                <div className="bd-formula-line">
                  {t('breakdown.homeValue')}: {formatNOK(finalYear.homeValue)}
                </div>
                <div className="bd-formula-line">
                  − {t('breakdown.remainingMortgage')}: {formatNOK(finalYear.remainingMortgage)}
                </div>
                {inputs.sharedDebt > 0 && (
                  <div className="bd-formula-line">
                    − {t('inputs.sharedDebt')}: {formatNOK(inputs.sharedDebt)}
                  </div>
                )}
                <div className="bd-formula-line">
                  − {t('inputs.brokerSellingFee')}: {formatNOK(inputs.brokerSellingFee)}
                </div>
                {mode === 'advanced' && finalYear.cumulativeBuyerWealthTax > 0 && (
                  <div className="bd-formula-line">
                    − {t('breakdown.accumulatedWealthTax')}: {formatNOK(finalYear.cumulativeBuyerWealthTax)}
                  </div>
                )}
                <div className="bd-formula-line">
                  ÷ {t('breakdown.inflationFactor')} ({inputs.inflation}%): {inflationFactor.toFixed(3)}
                </div>
                <div className="bd-formula-result bd-result-buy">
                  = {formatNOK(summary.finalEquity)}
                </div>
              </div>
            </div>

            <div className="bd-col bd-col-rent">
              <h3 className="bd-col-title">{t('breakdown.renterCalc')}</h3>

              <div className="bd-formula-block">
                <div className="bd-formula-title">{t('breakdown.initialInvestment')}</div>
                <div className="bd-formula-line">
                  {formatNOK(inputs.downPayment)} + {formatNOK(summary.closingCosts)} = <strong>{formatNOK(initialInvestment)}</strong>
                </div>
                <div className="bd-formula-note">{t('breakdown.initialInvestmentNote')}</div>
              </div>

              <div className="bd-formula-block">
                <div className="bd-formula-title">{t('breakdown.portfolioGrowth')}</div>
                {mode === 'advanced' ? (
                  <>
                    <div className="bd-formula-line">
                      {t('inputs.savingsAccountRate')}: {inputs.savingsAccountRate}% (22% skatt automatisk)
                    </div>
                    <div className="bd-formula-line">
                      {t('inputs.askRate')}: {inputs.askRate}% (37,84% ved uttak)
                    </div>
                    <div className="bd-formula-line bd-formula-note">
                      {t('inputs.savingsAccountBalance')}: {formatNOK(inputs.savingsAccountBalance)} i sparekonto
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bd-formula-line">
                      {t('breakdown.investReturn')}: {inputs.investmentReturn}%/{t('units.perYear').replace('/ ', '')}
                    </div>
                    <div className="bd-formula-line">{t('breakdown.taxNote37')}</div>
                  </>
                )}
                <div className="bd-formula-line">{t('breakdown.monthlyDiffNote')}</div>
                <div className="bd-formula-result bd-result-rent">
                  → {formatNOK(summary.finalRenterPortfolio)} {t('breakdown.afterYears', { years: inputs.years })}
                </div>
              </div>

              <div className="bd-formula-block">
                <div className="bd-formula-title">{t('breakdown.renterNetWorth')} (år {inputs.years})</div>
                <div className="bd-formula-line">
                  {t('breakdown.portfolioGross')}: {formatNOK(summary.finalRenterPortfolio * inflationFactor)}
                </div>
                <div className="bd-formula-line">
                  ÷ {t('breakdown.inflationFactor')} ({inputs.inflation}%): {inflationFactor.toFixed(3)}
                </div>
                <div className="bd-formula-result bd-result-rent">
                  = {formatNOK(summary.finalRenterPortfolio)}
                </div>
              </div>

              {mode === 'advanced' && (
                <div className="bd-formula-block">
                  <div className="bd-formula-title">{t('breakdown.norwegianRules')}</div>
                  <div className="bd-formula-line">{t('breakdown.wealthTaxHome')}</div>
                  <div className="bd-formula-line">{t('breakdown.wealthTaxSavings')}</div>
                  <div className="bd-formula-line">{t('breakdown.wealthTaxAsk')}</div>
                  <div className="bd-formula-line">{t('breakdown.wealthTaxThreshold')}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bd-section">
            <h3 className="bd-section-title">{t('breakdown.yearTable')}</h3>
            <div className="bd-table-wrap">
              <table className="bd-table">
                <thead>
                  <tr>
                    <th>{t('results.year')}</th>
                    <th>{t('breakdown.buyerMonthly')}</th>
                    <th>{t('breakdown.renterMonthly')}</th>
                    <th>{t('breakdown.homeValue')}</th>
                    <th>{t('breakdown.remainingMortgage')}</th>
                    <th className="bd-th-buy">{t('breakdown.buyerNetWorth')}</th>
                    <th className="bd-th-rent">{t('breakdown.renterNetWorthLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((row, idx) => {
                    const buyerWins = row.buyerNetWorth >= row.renterNetWorth
                    return (
                      <tr key={row.year} className={idx % 2 === 0 ? 'alt' : ''}>
                        <td className="bd-td-year">{row.year}</td>
                        <td>{formatNOK(row.buyerMonthlyCost)}</td>
                        <td>{formatNOK(row.renterMonthlyCost)}</td>
                        <td>{formatNOK(row.homeValue, true)}</td>
                        <td>{formatNOK(row.remainingMortgage, true)}</td>
                        <td className={buyerWins ? 'bd-winner-buy' : ''}>{formatNOK(row.buyerNetWorth, true)}</td>
                        <td className={!buyerWins ? 'bd-winner-rent' : ''}>{formatNOK(row.renterNetWorth, true)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="bd-table-note">{t('breakdown.tableNote')}</p>
          </div>

        </div>
      )}
    </div>
  )
}
