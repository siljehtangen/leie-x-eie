import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Download } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useFormatNOK } from '../hooks/useFormatNOK'
import { SECURITY_DEPOSIT_MONTHS } from '../constants/finance'
import type { CalculationResult, Inputs, Mode } from '../types'
import CalculationPDF from './CalculationPDF'
import BuyerColumn from './breakdown/BuyerColumn'
import RenterColumn from './breakdown/RenterColumn'
import YearlyTable from './breakdown/YearlyTable'

interface CalculationBreakdownProps {
  results: CalculationResult
  inputs: Inputs
  mode: Mode
}

export default function CalculationBreakdown({ results, inputs, mode }: CalculationBreakdownProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const formatKr = useFormatNOK()

  const isAdvanced = mode === 'advanced'
  const { summary, yearlyData } = results
  const initialInvestment = inputs.downPayment + summary.closingCosts
  const securityDeposit = isAdvanced ? inputs.monthlyRent * SECURITY_DEPOSIT_MONTHS : 0
  const finalYear = yearlyData[yearlyData.length - 1]

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
            <PDFDownloadLink
              document={<CalculationPDF results={results} inputs={inputs} mode={mode} title={t('breakdown.pdfDocTitle')} t={t} />}
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
                [t('inputs.purchasePrice'), formatKr(inputs.purchasePrice)],
                [t('inputs.downPayment'), formatKr(inputs.downPayment)],
                [t('breakdown.loanAmount'), formatKr(summary.loanAmount)],
                [t('inputs.mortgageRate'), `${inputs.mortgageRate}%`],
                [t('inputs.loanTermYears'), `${inputs.loanTermYears} ${t('units.years')}`],
                [t('inputs.monthlyHoaFee'), `${formatKr(inputs.monthlyHoaFee)}/${t('breakdown.month')}`],
                [t('inputs.monthlyRent'), `${formatKr(inputs.monthlyRent)}/${t('breakdown.month')}`],
                [t('inputs.rentIncrease'), `${inputs.rentIncrease}%`],
                [t('inputs.appreciationRate'), `${inputs.appreciationRate}%`],
                [t('inputs.years'), `${inputs.years} ${t('units.years')}`],
                isAdvanced
                  ? [t('inputs.inflation'), `${inputs.inflation}%`]
                  : [t('inputs.investmentReturn'), `${inputs.investmentReturn}%`],
                [t('inputs.brokerSellingFee'), formatKr(inputs.brokerSellingFee)],
                ...(isAdvanced && inputs.interestOnlyYears > 0
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
            <BuyerColumn
              t={t}
              formatKr={formatKr}
              inputs={inputs}
              summary={summary}
              yearlyData={yearlyData}
              isAdvanced={isAdvanced}
              finalYear={finalYear}
            />
            <RenterColumn
              t={t}
              formatKr={formatKr}
              inputs={inputs}
              summary={summary}
              isAdvanced={isAdvanced}
              bsuActive={inputs.bsuActive}
              initialInvestment={initialInvestment}
              securityDeposit={securityDeposit}
            />
          </div>

          <YearlyTable t={t} formatKr={formatKr} yearlyData={yearlyData} />
        </div>
      )}
    </div>
  )
}
