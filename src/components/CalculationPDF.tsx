import type { ReactNode } from 'react'
import {
  Document, Page, View, Text, Font,
} from '@react-pdf/renderer'
import { formatNOK } from '../utils/formatting'
import { COLORS } from '../constants/theme'
import { APP_NAME, APP_DOMAIN } from '../constants/app'
import { s } from './PDFStyles'
import type { BreakdownModel, TaxRuleParams } from '../utils/breakdownModel'
import type { CalculationResult, Inputs, TranslateFn } from '../types'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff',
      fontWeight: 700,
    },
  ],
})

interface PageShellProps {
  headerTitle: string
  headerSub: string
  date: string
  t: TranslateFn
  children: ReactNode
}

function PDFPageShell({ headerTitle, headerSub, date, t, children }: PageShellProps) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{headerTitle}</Text>
        <Text style={s.headerSub}>{headerSub} · {date}</Text>
      </View>
      <View style={s.body}>
        {children}
      </View>
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{APP_DOMAIN} · {date}</Text>
        <Text
          style={s.footerText}
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            t('pdf.pageOf', { page: pageNumber, total: totalPages })
          }
        />
      </View>
    </Page>
  )
}

interface CalculationPDFProps {
  results: CalculationResult
  inputs: Inputs
  model: BreakdownModel
  rules: TaxRuleParams
  locale: string
  title: string
  t: TranslateFn
}

export default function CalculationPDF({ results, inputs, model, rules, locale, title, t }: CalculationPDFProps) {
  const { yearlyData, recommendation, difference, breakevenYear } = results
  const { isAdvanced, mortgage, years } = model
  const fmt = (value: number, compact = true) => formatNOK(value, compact, locale)
  const isBuy = recommendation === 'buy'
  const date = new Date().toLocaleDateString(locale)
  const perMonth = `/${t('breakdown.month')}`

  return (
    <Document title={title} author={APP_NAME}>
      <PDFPageShell
        headerTitle={APP_NAME}
        headerSub={t('pdf.reportSubtitle')}
        date={date}
        t={t}
      >
        <View style={[s.recBox, isBuy ? s.recBoxBuy : s.recBoxRent]}>
          <View>
            <Text style={s.recEyebrow}>{t('pdf.recommendationAfterYears', { years })}</Text>
            <Text style={s.recTitle}>
              {t(isBuy ? 'recommendation.buy' : 'recommendation.rent')}
            </Text>
          </View>
          <View>
            <Text style={s.recAmountLabel}>{t('pdf.advantage')}</Text>
            <Text style={s.recAmount}>{fmt(difference)}</Text>
          </View>
        </View>

        <View style={s.metricsRow}>
          <View style={s.metricBox}>
            <Text style={s.metricLabel}>{t('pdf.metricBuyerNetWorth', { years })}</Text>
            <Text style={[s.metricValue, { color: COLORS.buy }]}>{fmt(model.buyerNetWorth)}</Text>
          </View>
          <View style={s.metricBox}>
            <Text style={s.metricLabel}>{t('pdf.metricRenterPortfolio', { years })}</Text>
            <Text style={[s.metricValue, { color: COLORS.rent }]}>{fmt(model.renterNetWorth)}</Text>
          </View>
          <View style={s.metricBox}>
            <Text style={s.metricLabel}>{t('recommendation.breakevenYear')}</Text>
            <Text style={s.metricValue}>{breakevenYear ? `${t('recommendation.year')} ${breakevenYear}` : '—'}</Text>
          </View>
          <View style={s.metricBox}>
            <Text style={s.metricLabel}>{t('pdf.mode')}</Text>
            <Text style={s.metricValue}>{t(isAdvanced ? 'mode.advanced' : 'mode.quick')}</Text>
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={[s.colTitle, s.colTitleBuy]}>{t('breakdown.buyerCalc')}</Text>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.inputs')}</Text>
              {[
                [t('inputs.purchasePrice'), fmt(inputs.purchasePrice)],
                [t('inputs.downPayment'), fmt(inputs.downPayment)],
                [t('breakdown.loanAmount'), fmt(mortgage.loanAmount)],
                [t('pdf.rate'), `${mortgage.ratePct}%`],
                [t('inputs.loanTermYears'), `${mortgage.loanTermYears} ${t('units.years')}`],
                [t('pdf.hoaFee'), `${fmt(inputs.monthlyHoaFee)}${perMonth}`],
                [t('inputs.stampDuty'), fmt(inputs.stampDuty)],
              ].map(([label, val], i) => (
                <View key={label} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                  <Text style={s.rowLabel}>{label}</Text>
                  <Text style={s.rowValue}>{val}</Text>
                </View>
              ))}
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.monthlyMortgageCalc')}</Text>
              <Text style={s.step}>r = {mortgage.ratePct}% ÷ 12 = {(mortgage.monthlyRate * 100).toFixed(4)}%{perMonth}</Text>
              <Text style={s.step}>n = {mortgage.loanTermYears} × 12 = {mortgage.numPayments} {t('breakdown.payments')}</Text>
              {mortgage.ioYears > 0 && (
                <>
                  <Text style={s.stepMuted}>{t('breakdown.ioPhase', { years: mortgage.ioYears })}</Text>
                  <Text style={s.step}>{t('breakdown.payment')} = L × r = {fmt(mortgage.ioPayment, false)}{perMonth}</Text>
                  <Text style={s.stepMuted}>
                    {t('breakdown.amortizingPhase', { from: mortgage.ioYears + 1, months: mortgage.remainingTermMonths })}
                  </Text>
                </>
              )}
              <Text style={s.step}>{t('breakdown.payment')} = L × r(1+r)^n / ((1+r)^n − 1)</Text>
              <Text style={s.stepMuted}>{t('breakdown.formulaWhere')}</Text>
              <Text style={s.stepMuted}>L = {t('breakdown.formulaL', { amount: fmt(mortgage.loanAmount, false) })}</Text>
              <Text style={s.stepMuted}>r = {t('breakdown.formulaR', { rate: `${(mortgage.monthlyRate * 100).toFixed(4)}%` })}</Text>
              <Text style={s.stepMuted}>
                n = {mortgage.ioYears > 0
                  ? t('breakdown.formulaNAfterIo', { count: mortgage.remainingTermMonths })
                  : t('breakdown.formulaN', { count: mortgage.remainingTermMonths })}
              </Text>
              <Text style={s.stepMuted}>{t('breakdown.formulaExplainer')}</Text>
              <Text style={[s.result, s.resultBuy]}>{fmt(mortgage.amortizingPayment, false)}{perMonth}</Text>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.year1MonthlyCost')}</Text>
              {model.buyerCostLines.map((l, i) => (
                <View key={l.id} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                  <Text style={s.rowLabel}>{t(l.labelKey, l.labelOpts)}</Text>
                  <Text style={s.rowValue}>{l.sign} {fmt(l.amount)}</Text>
                </View>
              ))}
              <View style={[s.row, { backgroundColor: COLORS.buyLight }]}>
                <Text style={[s.rowLabel, { fontWeight: 700 }]}>{t('breakdown.totalMonthly')}</Text>
                <Text style={[s.rowValue, { color: COLORS.buy }]}>{fmt(model.buyerMonthlyTotal)}</Text>
              </View>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.buyerNetWorth')} ({years} {t('units.years')})</Text>
              {model.buyerNetWorthLines.map((l, i) => (
                <Text key={l.id} style={s.step}>
                  {i > 0 ? `${l.sign} ` : ''}{t(l.labelKey, { pct: rules.askTax, ...l.labelOpts })}: {fmt(l.amount)}
                </Text>
              ))}
              <Text style={s.step}>÷ {t('breakdown.inflationFactor')}: {model.inflationFactor.toFixed(3)}</Text>
              <Text style={[s.result, s.resultBuy]}>{fmt(model.buyerNetWorth, false)}</Text>
            </View>
          </View>

          <View style={s.col}>
            <Text style={[s.colTitle, s.colTitleRent]}>{t('breakdown.renterCalc')}</Text>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.inputs')}</Text>
              {[
                [t('inputs.monthlyRent'), `${fmt(inputs.monthlyRent)}${perMonth}`],
                [t('inputs.rentIncrease'), `${inputs.rentIncrease}%`],
                isAdvanced
                  ? [t('pdf.savingsAccount'), `${fmt(inputs.savingsAccountBalance)} @ ${inputs.savingsAccountRate}%`]
                  : [t('breakdown.investReturn'), `${inputs.investmentReturn}%`],
                isAdvanced
                  ? [t('pdf.askAccount'), `${fmt(inputs.askBalance)} @ ${inputs.askRate}%`]
                  : [t('pdf.taxOnReturn'), t('pdf.taxAuto', { pct: rules.savingsTax })],
              ].map(([label, val], i) => (
                <View key={label} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                  <Text style={s.rowLabel}>{label}</Text>
                  <Text style={s.rowValue}>{val}</Text>
                </View>
              ))}
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.initialInvestment')}</Text>
              {isAdvanced ? (
                <>
                  <Text style={s.step}>{t('pdf.savingsAccount')}: {fmt(inputs.savingsAccountBalance)}</Text>
                  <Text style={s.step}>+ {t('pdf.askAccount')}: {fmt(inputs.askBalance)}</Text>
                  <Text style={s.step}>
                    + {t('inputs.downPayment')} + {t('inputs.stampDuty')}: {fmt(model.initialInvestment)} ({t('breakdown.initialInvestmentAskNote')})
                  </Text>
                  <Text style={s.step}>
                    − {t('breakdown.securityDeposit')}: {fmt(model.securityDeposit)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.step}>{t('inputs.downPayment')}: {fmt(inputs.downPayment)}</Text>
                  <Text style={s.step}>+ {t('inputs.stampDuty')}: {fmt(model.closingCosts)}</Text>
                  <Text style={[s.result, s.resultRent]}>{fmt(model.initialInvestment)}</Text>
                </>
              )}
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.portfolioGrowth')}</Text>
              {isAdvanced ? (
                <>
                  <Text style={s.step}>
                    {t('pdf.savingsAccount')}: {fmt(inputs.savingsAccountBalance)} @ {inputs.savingsAccountRate}% ({t('pdf.savingsTaxNote', { pct: rules.savingsTax })})
                  </Text>
                  <Text style={s.step}>
                    {t('pdf.askAccount')}: {fmt(inputs.askBalance)} @ {inputs.askRate}% ({t('pdf.askTaxNote', { pct: rules.askTax })})
                  </Text>
                </>
              ) : (
                <Text style={s.step}>{t('pdf.investReturnLine', { return: inputs.investmentReturn, pct: rules.savingsTax })}</Text>
              )}
              <Text style={s.step}>{t('pdf.monthlyDiffShort')}</Text>
              {model.renterNetWorthLines.map((l, i) => (
                <Text key={l.id} style={s.step}>
                  {i > 0 ? `${l.sign} ` : ''}{t(l.labelKey, { pct: rules.askTax, ...l.labelOpts })}: {fmt(l.amount)}
                </Text>
              ))}
              <Text style={s.step}>÷ {t('breakdown.inflationFactor')}: {model.inflationFactor.toFixed(3)}</Text>
              <Text style={[s.result, s.resultRent]}>
                {fmt(model.renterNetWorth)} {t('breakdown.afterYears', { years })}
              </Text>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.norwegianRules')}</Text>
              <Text style={s.step}>{t('pdf.interestDeductionLine', { pct: rules.interestDeduction })}</Text>
              <Text style={s.step}>{t('pdf.inflationLine', { inflation: inputs.inflation })}</Text>
              {isAdvanced && (
                <>
                  <Text style={s.step}>
                    {t('pdf.wealthTaxCombined', { home: rules.homeValuation, savings: rules.savingsValuation, ask: rules.askValuation })}
                  </Text>
                  <Text style={s.step}>
                    {t('breakdown.wealthTaxThreshold', { threshold: rules.wealthTaxThreshold, rate: rules.wealthTaxRate })}
                  </Text>
                  <Text style={s.step}>
                    {t('breakdown.wealthTaxHighTier', { threshold: rules.wealthTaxHighThreshold, rate: rules.wealthTaxHighRate })}
                  </Text>
                </>
              )}
              <Text style={s.stepMuted}>{t('pdf.realTermsNote')}</Text>
            </View>
          </View>
        </View>
      </PDFPageShell>

      <PDFPageShell
        headerTitle={t('breakdown.yearTable')}
        headerSub={t('pdf.yearByYearSubtitle', { inflation: inputs.inflation })}
        date={date}
        t={t}
      >
        <View style={s.tableHead}>
          <Text style={[s.th, s.thFirst, { flex: 0.35 }]}>{t('results.year')}</Text>
          <Text style={[s.th, { flex: 0.9 }]}>{t('breakdown.buyerMonthly')}</Text>
          <Text style={[s.th, { flex: 0.9 }]}>{t('breakdown.renterMonthly')}</Text>
          <Text style={s.th}>{t('breakdown.homeValue')}</Text>
          <Text style={s.th}>{t('breakdown.remainingMortgage')}</Text>
          <Text style={[s.th, s.thBuy, { flex: 1.2 }]}>{t('breakdown.buyerNetWorth')}</Text>
          <Text style={[s.th, s.thRent, { flex: 1.2 }]}>{t('breakdown.renterNetWorthLabel')}</Text>
        </View>

        {yearlyData.map((row, idx) => {
          const buyerWins = row.buyerNetWorth >= row.renterNetWorth
          return (
            <View key={row.year} style={[s.tr, idx % 2 === 0 ? s.trAlt : {}]}>
              <Text style={[s.td, s.tdFirst, { flex: 0.35 }]}>{row.year}</Text>
              <Text style={[s.td, { flex: 0.9 }]}>{fmt(row.buyerMonthlyCost)}</Text>
              <Text style={[s.td, { flex: 0.9 }]}>{fmt(row.renterMonthlyCost)}</Text>
              <Text style={s.td}>{fmt(row.homeValue)}</Text>
              <Text style={s.td}>{fmt(row.remainingMortgage)}</Text>
              <Text style={[s.td, { flex: 1.2 }, buyerWins ? s.tdBuyWin : {}]}>
                {fmt(row.buyerNetWorth)}
              </Text>
              <Text style={[s.td, { flex: 1.2 }, !buyerWins ? s.tdRentWin : {}]}>
                {fmt(row.renterNetWorth)}
              </Text>
            </View>
          )
        })}

        <View style={s.note}>
          <Text style={s.noteTitle}>{t('pdf.notes')}</Text>
          <Text style={s.noteLine}>{t('pdf.notesBuyerEquity')}</Text>
          <Text style={s.noteLine}>{t('pdf.notesRenterEquity')}</Text>
          <Text style={s.noteLine}>
            {t('pdf.notesBreakeven', {
              value: breakevenYear
                ? t('pdf.notesBreakevenCross', { year: breakevenYear })
                : t('pdf.notesBreakevenNone'),
            })}
          </Text>
          <Text style={s.noteLine}>{t('pdf.notesDisclaimer')}</Text>
        </View>
      </PDFPageShell>
    </Document>
  )
}
