import { SECURITY_DEPOSIT_MONTHS, SAVINGS_TAX_RATE, ASK_TAX_RATE, BSU_TAX_DEDUCTION_RATE } from '../../constants/finance'
import type { Inputs, Summary } from '../../types'

type FormatFn = (value: number, compact?: boolean) => string
type TFn = (key: string, opts?: Record<string, unknown>) => string

export interface RenterColumnProps {
  t: TFn
  formatKr: FormatFn
  inputs: Inputs
  summary: Summary
  isAdvanced: boolean
  bsuActive: boolean
  initialInvestment: number
  securityDeposit: number
}

export default function RenterColumn({ t, formatKr, inputs, summary, isAdvanced, bsuActive, initialInvestment, securityDeposit }: RenterColumnProps) {
  const { finalInflationFactor: inflationFactor } = summary

  return (
    <div className="bd-col bd-col-rent">
      <h3 className="bd-col-title">{t('breakdown.renterCalc')}</h3>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.initialInvestment')}</div>
        {isAdvanced ? (
          <>
            <div className="bd-formula-line bd-formula-note">
              {t('inputs.savingsAccountBalance')}: <strong>{formatKr(inputs.savingsAccountBalance)}</strong>
            </div>
            <div className="bd-formula-line bd-formula-note">
              {t('inputs.askBalance')}: <strong>{formatKr(inputs.askBalance)}</strong>
            </div>
            <div className="bd-formula-line">
              {t('breakdown.total')}: <strong>{formatKr(inputs.savingsAccountBalance + inputs.askBalance)}</strong>
            </div>
            <div className="bd-formula-line bd-formula-note">
              − {t('breakdown.securityDeposit')} ({SECURITY_DEPOSIT_MONTHS} mnd): {formatKr(securityDeposit)} → {t('breakdown.securityDepositNote')}
            </div>
          </>
        ) : (
          <>
            <div className="bd-formula-line">
              {formatKr(inputs.downPayment)} + {formatKr(summary.closingCosts)} = <strong>{formatKr(initialInvestment)}</strong>
            </div>
            <div className="bd-formula-note">{t('breakdown.initialInvestmentNote')}</div>
          </>
        )}
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.portfolioGrowth')}</div>
        {isAdvanced ? (
          <>
            <div className="bd-formula-line bd-formula-note">
              {t('inputs.savingsAccountBalance')}: {formatKr(inputs.savingsAccountBalance)} @ {inputs.savingsAccountRate}% ({(SAVINGS_TAX_RATE * 100).toFixed(0)}% skatt automatisk)
            </div>
            <div className="bd-formula-line bd-formula-note">
              {t('inputs.askBalance')}: {formatKr(inputs.askBalance)} @ {inputs.askRate}% ({(ASK_TAX_RATE * 100).toFixed(2).replace('.', ',')}% ved uttak)
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
          → {formatKr(summary.finalRenterPortfolio)} {t('breakdown.afterYears', { years: inputs.years })}
        </div>
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">{t('breakdown.renterNetWorth')} ({inputs.years} {t('units.years')})</div>
        <div className="bd-formula-line">
          {t('breakdown.portfolioGross')}: {formatKr(summary.finalRenterNominalGross)}
        </div>
        {isAdvanced && summary.finalAskTax > 0 && (
          <div className="bd-formula-line">
            − {t('breakdown.askCapitalGainsTax')}: {formatKr(summary.finalAskTax)}
          </div>
        )}
        {isAdvanced && inputs.askShieldingRate > 0 && (
          <div className="bd-formula-note">
            {t('breakdown.shieldingNote', { rate: inputs.askShieldingRate })}
          </div>
        )}
        {isAdvanced && bsuActive && (
          <div className="bd-formula-note">
            {t('breakdown.bsuBenefit', { amount: Math.round(inputs.bsuYearlyContribution * BSU_TAX_DEDUCTION_RATE) })}
          </div>
        )}
        <div className="bd-formula-line">
          ÷ {t('breakdown.inflationFactor')} ({inputs.inflation}%): {inflationFactor.toFixed(3)}
        </div>
        <div className="bd-formula-result bd-result-rent">
          = {formatKr(summary.finalRenterPortfolio)}
        </div>
      </div>

      {isAdvanced && (
        <div className="bd-formula-block">
          <div className="bd-formula-title">{t('breakdown.norwegianRules')}</div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxHome')}</div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxHomeTiered')}</div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxSavings')}</div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxAsk')}</div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxThreshold')}</div>
        </div>
      )}
    </div>
  )
}
