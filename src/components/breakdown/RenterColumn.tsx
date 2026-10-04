import { SECURITY_DEPOSIT_MONTHS, BSU_TAX_DEDUCTION_RATE } from '../../constants/finance'
import type { Inputs, FormatKrFn, TranslateFn } from '../../types'
import type { BreakdownModel, TaxRuleParams } from '../../utils/breakdownModel'
import { formatDecimal, formatPct, formatPercent } from '../../utils/formatting'

export interface RenterColumnProps {
  t: TranslateFn
  formatKr: FormatKrFn
  locale: string
  inputs: Inputs
  model: BreakdownModel
  rules: TaxRuleParams
}

export default function RenterColumn({ t, formatKr, locale, inputs, model, rules }: RenterColumnProps) {
  const { isAdvanced, inflationFactor } = model

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
            <div className="bd-formula-line bd-formula-note">
              + {t('inputs.downPayment')} + {t('inputs.stampDuty')}:{' '}
              <strong>{formatKr(model.initialInvestment)}</strong> → {t('breakdown.initialInvestmentAskNote')}
            </div>
            <div className="bd-formula-line">
              {t('breakdown.total')}:{' '}
              <strong>{formatKr(inputs.savingsAccountBalance + inputs.askBalance + model.initialInvestment)}</strong>
            </div>
            <div className="bd-formula-line bd-formula-note">
              − {t('breakdown.securityDepositMonths', { months: SECURITY_DEPOSIT_MONTHS })}:{' '}
              {formatKr(model.securityDeposit)} → {t('breakdown.securityDepositNote')}
            </div>
          </>
        ) : (
          <>
            <div className="bd-formula-line">
              {formatKr(inputs.downPayment)} + {formatKr(model.closingCosts)} ={' '}
              <strong>{formatKr(model.initialInvestment)}</strong>
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
              {t('inputs.savingsAccountBalance')}: {formatKr(inputs.savingsAccountBalance)} @{' '}
              {formatPercent(inputs.savingsAccountRate, locale)} (
              {t('breakdown.savingsTaxAuto', { pct: rules.savingsTax })})
            </div>
            <div className="bd-formula-line bd-formula-note">
              {t('inputs.askBalance')}: {formatKr(inputs.askBalance)} @ {formatPercent(inputs.askRate, locale)} (
              {t('breakdown.askTaxOnWithdrawal', { pct: rules.askTax })})
            </div>
          </>
        ) : (
          <>
            <div className="bd-formula-line">
              {t('breakdown.investReturn')}:{' '}
              {t('breakdown.investReturnValue', { rate: formatPct(inputs.investmentReturn, locale) })}
            </div>
            <div className="bd-formula-line">{t('breakdown.quickTaxNote', { pct: rules.savingsTax })}</div>
          </>
        )}
        <div className="bd-formula-line">{t('breakdown.monthlyDiffNote')}</div>
        <div className="bd-formula-result bd-result-rent">
          → {formatKr(model.renterNetWorthLines[0].amount)} {t('breakdown.afterYears', { years: model.years })}
        </div>
      </div>

      <div className="bd-formula-block">
        <div className="bd-formula-title">
          {t('breakdown.renterNetWorth')} ({model.years} {t('units.years')})
        </div>
        {model.renterNetWorthLines.map((l, i) => (
          <div key={l.id} className="bd-formula-line">
            {i > 0 && `${l.sign} `}
            {t(l.labelKey, { pct: rules.askTax, ...l.labelOpts })}: {formatKr(l.amount)}
          </div>
        ))}
        {isAdvanced && inputs.askShieldingRate > 0 && (
          <div className="bd-formula-note">
            {t('breakdown.shieldingNote', { rate: formatPct(inputs.askShieldingRate, locale) })}
          </div>
        )}
        {isAdvanced && inputs.bsuActive && (
          <div className="bd-formula-note">
            {t('breakdown.bsuBenefit', { amount: formatKr(inputs.bsuYearlyContribution * BSU_TAX_DEDUCTION_RATE) })}
          </div>
        )}
        <div className="bd-formula-line">
          ÷ {t('breakdown.inflationFactor')} ({formatPercent(inputs.inflation, locale)}):{' '}
          {formatDecimal(inflationFactor, locale)}
        </div>
        <div className="bd-formula-result bd-result-rent">= {formatKr(model.renterNetWorth)}</div>
      </div>

      {isAdvanced && (
        <div className="bd-formula-block">
          <div className="bd-formula-title">{t('breakdown.norwegianRules')}</div>
          <div className="bd-formula-line">
            {t('breakdown.wealthTaxHome', { pct: rules.homeValuation, threshold: rules.homeHighThreshold })}
          </div>
          <div className="bd-formula-line">
            {t('breakdown.wealthTaxHomeTiered', { pct: rules.homeHighValuation, threshold: rules.homeHighThreshold })}
          </div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxSavings', { pct: rules.savingsValuation })}</div>
          <div className="bd-formula-line">{t('breakdown.wealthTaxAsk', { pct: rules.askValuation })}</div>
          <div className="bd-formula-line">
            {t('breakdown.wealthTaxThreshold', { threshold: rules.wealthTaxThreshold, rate: rules.wealthTaxRate })}
          </div>
          <div className="bd-formula-line">
            {t('breakdown.wealthTaxHighTier', {
              threshold: rules.wealthTaxHighThreshold,
              rate: rules.wealthTaxHighRate,
            })}
          </div>
        </div>
      )}
    </div>
  )
}
