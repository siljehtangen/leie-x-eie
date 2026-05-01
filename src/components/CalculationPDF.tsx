import {
  Document, Page, View, Text, Font,
} from '@react-pdf/renderer'
import { formatNOK } from '../utils/calculations'
import { COLORS } from '../constants/theme'
import { INTEREST_DEDUCTION } from '../constants/finance'
import { APP_NAME, APP_DOMAIN } from '../constants/app'
import { s } from './PDFStyles'
import type { CalculationResult, Inputs, Mode } from '../types'

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

type TFn = (key: string, opts?: Record<string, unknown>) => string

interface PageShellProps {
  headerTitle: string
  headerSub: string
  date: string
  t: TFn
  children: React.ReactNode
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
  mode: Mode
  title: string
  t: TFn
}

export default function CalculationPDF({ results, inputs, mode, title, t }: CalculationPDFProps) {
  const { summary, yearlyData, recommendation, difference, breakevenYear } = results
  const isAdvanced = mode === 'advanced'
  const { loanAmount, monthlyRate, numPayments: n, finalInflationFactor } = summary
  const initialInvestment = inputs.downPayment + summary.closingCosts
  const isBuy = recommendation === 'buy'
  const finalYear = yearlyData[inputs.years - 1]
  const date = new Date().toLocaleDateString('nb-NO')
  const interestDeductionPct = `${(INTEREST_DEDUCTION * 100).toFixed(0)}%`

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
            <Text style={s.recEyebrow}>{t('pdf.recommendationAfterYears', { years: inputs.years })}</Text>
            <Text style={s.recTitle}>
              {t(isBuy ? 'recommendation.buy' : 'recommendation.rent')}
            </Text>
          </View>
          <View>
            <Text style={s.recAmountLabel}>{t('pdf.advantage')}</Text>
            <Text style={s.recAmount}>{formatNOK(difference, true)}</Text>
          </View>
        </View>

        <View style={s.metricsRow}>
          <View style={s.metricBox}>
            <Text style={s.metricLabel}>{t('pdf.metricBuyerNetWorth', { years: inputs.years })}</Text>
            <Text style={[s.metricValue, { color: COLORS.buy }]}>{formatNOK(summary.finalEquity, true)}</Text>
          </View>
          <View style={s.metricBox}>
            <Text style={s.metricLabel}>{t('pdf.metricRenterPortfolio', { years: inputs.years })}</Text>
            <Text style={[s.metricValue, { color: COLORS.rent }]}>{formatNOK(summary.finalRenterPortfolio, true)}</Text>
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
                [t('inputs.purchasePrice'), formatNOK(inputs.purchasePrice, true)],
                [t('inputs.downPayment'), formatNOK(inputs.downPayment, true)],
                [t('breakdown.loanAmount'), formatNOK(loanAmount, true)],
                [t('pdf.rate'), `${inputs.mortgageRate}%`],
                [t('inputs.loanTermYears'), `${inputs.loanTermYears} ${t('units.years')}`],
                [t('pdf.hoaFee'), `${formatNOK(inputs.monthlyHoaFee, true)}/${t('breakdown.month')}`],
                [t('inputs.stampDuty'), formatNOK(inputs.stampDuty, true)],
              ].map(([label, val], i) => (
                <View key={label} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                  <Text style={s.rowLabel}>{label}</Text>
                  <Text style={s.rowValue}>{val}</Text>
                </View>
              ))}
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.monthlyMortgageCalc')}</Text>
              <Text style={s.step}>r = {inputs.mortgageRate}% ÷ 12 = {(monthlyRate * 100).toFixed(4)}%/{t('breakdown.month')}</Text>
              <Text style={s.step}>n = {inputs.loanTermYears} × 12 = {n} {t('breakdown.payments')}</Text>
              <Text style={s.step}>{t('breakdown.payment')} = L × r(1+r)^n / ((1+r)^n − 1)</Text>
              <Text style={[s.result, s.resultBuy]}>{formatNOK(summary.monthlyMortgagePayment)}/{t('breakdown.month')}</Text>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.year1MonthlyCost')}</Text>
              <View style={[s.row, s.rowAlt]}>
                <Text style={s.rowLabel}>{t('breakdown.mortgagePayment')}</Text>
                <Text style={s.rowValue}>+ {formatNOK(summary.monthlyMortgagePayment, true)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.rowLabel}>{t('pdf.hoaFee')}</Text>
                <Text style={s.rowValue}>+ {formatNOK(inputs.monthlyHoaFee, true)}</Text>
              </View>
              <View style={[s.row, s.rowAlt]}>
                <Text style={s.rowLabel}>{t('breakdown.interestDeduction')} ({interestDeductionPct})</Text>
                <Text style={s.rowValue}>− {formatNOK(loanAmount * monthlyRate * INTEREST_DEDUCTION, true)}</Text>
              </View>
              <View style={[s.row, { backgroundColor: COLORS.buyLight }]}>
                <Text style={[s.rowLabel, { fontWeight: 700 }]}>{t('breakdown.totalMonthly')}</Text>
                <Text style={[s.rowValue, { color: COLORS.buy }]}>{formatNOK(yearlyData[0].buyerMonthlyCost, true)}</Text>
              </View>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.buyerNetWorth')} ({t('units.years')} {inputs.years})</Text>
              <Text style={s.step}>{t('breakdown.homeValue')}: {formatNOK(finalYear.homeValue, true)}</Text>
              <Text style={s.step}>− {t('breakdown.remainingMortgage')}: {formatNOK(finalYear.remainingMortgage, true)}</Text>
              {inputs.sharedDebt > 0 && (
                <Text style={s.step}>− {t('inputs.sharedDebt')}: {formatNOK(inputs.sharedDebt, true)}</Text>
              )}
              <Text style={s.step}>− {t('pdf.brokerFee')}: {formatNOK(inputs.brokerSellingFee, true)}</Text>
              {isAdvanced && finalYear.cumulativeBuyerWealthTax > 0 && (
                <Text style={s.step}>− {t('breakdown.accumulatedWealthTax')}: {formatNOK(finalYear.cumulativeBuyerWealthTax, true)}</Text>
              )}
              <Text style={s.step}>÷ {t('breakdown.inflationFactor')}: {finalInflationFactor.toFixed(3)}</Text>
              <Text style={[s.result, s.resultBuy]}>{formatNOK(summary.finalEquity)}</Text>
            </View>
          </View>

          <View style={s.col}>
            <Text style={[s.colTitle, s.colTitleRent]}>{t('breakdown.renterCalc')}</Text>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.inputs')}</Text>
              {[
                [t('inputs.monthlyRent'), `${formatNOK(inputs.monthlyRent, true)}/${t('breakdown.month')}`],
                [t('inputs.rentIncrease'), `${inputs.rentIncrease}%`],
                isAdvanced
                  ? [t('pdf.savingsAccount'), `${formatNOK(inputs.savingsAccountBalance, true)} @ ${inputs.savingsAccountRate}%`]
                  : [t('breakdown.investReturn'), `${inputs.investmentReturn}%`],
                isAdvanced
                  ? ['ASK', `${formatNOK(inputs.askBalance, true)} @ ${inputs.askRate}%`]
                  : [t('pdf.taxOnReturn'), '22% (auto)'],
              ].map(([label, val], i) => (
                <View key={label} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                  <Text style={s.rowLabel}>{label}</Text>
                  <Text style={s.rowValue}>{val}</Text>
                </View>
              ))}
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.initialInvestment')}</Text>
              <Text style={s.step}>{t('inputs.downPayment')}: {formatNOK(inputs.downPayment, true)}</Text>
              <Text style={s.step}>+ {isAdvanced && inputs.otherClosingCosts > 0 ? t('pdf.closingCosts') : t('inputs.stampDuty')}: {formatNOK(summary.closingCosts, true)}</Text>
              <Text style={[s.result, s.resultRent]}>{formatNOK(initialInvestment, true)}</Text>
              <Text style={s.stepMuted}>{t('pdf.realTermsNote')}</Text>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.portfolioGrowth')}</Text>
              {isAdvanced ? (
                <>
                  <Text style={s.step}>{t('pdf.savingsAccount')}: {formatNOK(inputs.savingsAccountBalance, true)} @ {inputs.savingsAccountRate}% ({t('pdf.savingsTaxNote')})</Text>
                  <Text style={s.step}>ASK: {formatNOK(inputs.askBalance, true)} @ {inputs.askRate}% ({t('pdf.askTaxNote')})</Text>
                </>
              ) : (
                <Text style={s.step}>{t('pdf.investReturnLine', { return: inputs.investmentReturn })}</Text>
              )}
              <Text style={s.step}>{t('pdf.monthlyDiffShort')}</Text>
              <Text style={[s.result, s.resultRent]}>{formatNOK(summary.finalRenterPortfolio, true)} {t('breakdown.afterYears', { years: inputs.years })}</Text>
            </View>

            <View style={s.block}>
              <Text style={s.blockTitle}>{t('breakdown.norwegianRules')}</Text>
              <Text style={s.step}>{t('pdf.interestDeductionLine')}</Text>
              <Text style={s.step}>{t('pdf.inflationLine', { inflation: inputs.inflation })}</Text>
              {isAdvanced && (
                <>
                  <Text style={s.step}>{t('pdf.wealthTaxCombined')}</Text>
                  <Text style={s.step}>{t('breakdown.wealthTaxThreshold')}</Text>
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
          <Text style={[s.th, { flex: 1.2, color: 'rgba(105,144,212,0.95)' }]}>{t('breakdown.buyerNetWorth')}</Text>
          <Text style={[s.th, { flex: 1.2, color: 'rgba(196,146,100,0.95)' }]}>{t('breakdown.renterNetWorthLabel')}</Text>
        </View>

        {yearlyData.map((row, idx) => {
          const buyerWins = row.buyerNetWorth >= row.renterNetWorth
          return (
            <View key={row.year} style={[s.tr, idx % 2 === 0 ? s.trAlt : {}]}>
              <Text style={[s.td, s.tdFirst, { flex: 0.35 }]}>{row.year}</Text>
              <Text style={[s.td, { flex: 0.9 }]}>{formatNOK(row.buyerMonthlyCost, true)}</Text>
              <Text style={[s.td, { flex: 0.9 }]}>{formatNOK(row.renterMonthlyCost, true)}</Text>
              <Text style={s.td}>{formatNOK(row.homeValue, true)}</Text>
              <Text style={s.td}>{formatNOK(row.remainingMortgage, true)}</Text>
              <Text style={[s.td, { flex: 1.2 }, buyerWins ? s.tdBuyWin : {}]}>
                {formatNOK(row.buyerNetWorth, true)}
              </Text>
              <Text style={[s.td, { flex: 1.2 }, !buyerWins ? s.tdRentWin : {}]}>
                {formatNOK(row.renterNetWorth, true)}
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
