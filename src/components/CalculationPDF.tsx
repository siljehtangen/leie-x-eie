import {
  Document, Page, View, Text, StyleSheet, Font,
} from '@react-pdf/renderer'
import { formatNOK } from '../utils/calculations'
import { COLORS } from '../constants/theme'
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


const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    padding: 0,
  },
  header: {
    backgroundColor: COLORS.dark,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 32,
    paddingRight: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.50)',
    marginTop: 3,
  },
  body: {
    paddingTop: 18,
    paddingBottom: 40,
    paddingLeft: 32,
    paddingRight: 32,
  },
  recBox: {
    borderRadius: 10,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recBoxBuy: { backgroundColor: COLORS.buy },
  recBoxRent: { backgroundColor: COLORS.rent },
  recEyebrow: { fontSize: 7, color: 'rgba(255,255,255,0.60)', marginBottom: 3 },
  recTitle: { fontSize: 14, fontWeight: 700, color: '#FFFFFF' },
  recAmountLabel: { fontSize: 7, color: 'rgba(255,255,255,0.60)', marginBottom: 2, textAlign: 'right' },
  recAmount: { fontSize: 18, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 7,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
  },
  metricLabel: { fontSize: 7, color: COLORS.textMuted, marginBottom: 3 },
  metricValue: { fontSize: 10, fontWeight: 700, color: COLORS.text },
  twoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  colTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
  },
  colTitleBuy: { color: COLORS.buy, borderBottomColor: COLORS.buy },
  colTitleRent: { color: COLORS.rent, borderBottomColor: COLORS.rent },
  block: {
    backgroundColor: COLORS.surface,
    borderRadius: 7,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
  },
  blockTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: COLORS.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 3,
    marginBottom: 1,
  },
  rowAlt: { backgroundColor: COLORS.bg },
  rowLabel: { fontSize: 7.5, color: COLORS.textSecondary },
  rowValue: { fontSize: 7.5, fontWeight: 700, color: COLORS.text },
  step: { fontSize: 7.5, color: COLORS.text, marginBottom: 2 },
  stepMuted: { fontSize: 7, color: COLORS.textMuted, marginBottom: 2 },
  result: { fontSize: 9, fontWeight: 700, marginTop: 4 },
  resultBuy: { color: COLORS.buy },
  resultRent: { color: COLORS.rent },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark,
    borderRadius: 5,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 6,
    paddingRight: 6,
    marginBottom: 2,
  },
  th: { flex: 1, fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.70)', textAlign: 'right' },
  thFirst: { textAlign: 'left' },
  tr: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 3,
  },
  trAlt: { backgroundColor: COLORS.surface },
  td: { flex: 1, fontSize: 7.5, color: COLORS.text, textAlign: 'right' },
  tdFirst: { textAlign: 'left', fontWeight: 700 },
  tdBuyWin: { color: COLORS.buy, fontWeight: 700 },
  tdRentWin: { color: COLORS.rent, fontWeight: 700 },
  note: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 7,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
  },
  noteTitle: { fontSize: 7, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 5, textTransform: 'uppercase' },
  noteLine: { fontSize: 7, color: COLORS.textSecondary, marginBottom: 2 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: COLORS.textMuted },
})

interface Props {
  results: CalculationResult
  inputs: Inputs
  mode: Mode
  title: string
}

export default function CalculationPDF({ results, inputs, mode, title }: Props) {
  const { summary, yearlyData, recommendation, difference, breakevenYear } = results
  const loanAmount = inputs.purchasePrice - inputs.downPayment
  const monthlyRate = inputs.mortgageRate / 100 / 12
  const n = inputs.loanTermYears * 12
  const initialInvestment = inputs.downPayment + summary.closingCosts
  const isBuy = recommendation === 'buy'
  const finalYear = yearlyData[inputs.years - 1]
  const date = new Date().toLocaleDateString('nb-NO')

  return (
    <Document title={title} author="LeieXEie">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>LeieXEie</Text>
          <Text style={s.headerSub}>Leie vs Eie – Beregningsrapport · {date}</Text>
        </View>

        <View style={s.body}>
          <View style={[s.recBox, isBuy ? s.recBoxBuy : s.recBoxRent]}>
            <View>
              <Text style={s.recEyebrow}>Anbefaling etter {inputs.years} år</Text>
              <Text style={s.recTitle}>
                {isBuy ? 'Det lønner seg å eie' : 'Det lønner seg å leie'}
              </Text>
            </View>
            <View>
              <Text style={s.recAmountLabel}>Fordel</Text>
              <Text style={s.recAmount}>{formatNOK(difference, true)}</Text>
            </View>
          </View>

          <View style={s.metricsRow}>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Kjøpers formue (år {inputs.years})</Text>
              <Text style={[s.metricValue, { color: COLORS.buy }]}>{formatNOK(summary.finalEquity, true)}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Leietakers portefølje (år {inputs.years})</Text>
              <Text style={[s.metricValue, { color: COLORS.rent }]}>{formatNOK(summary.finalRenterPortfolio, true)}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Break-even år</Text>
              <Text style={s.metricValue}>{breakevenYear ? `År ${breakevenYear}` : '—'}</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={s.metricLabel}>Modus</Text>
              <Text style={s.metricValue}>{mode === 'advanced' ? 'Avansert' : 'Rask'}</Text>
            </View>
          </View>

          <View style={s.twoCol}>
            <View style={s.col}>
              <Text style={[s.colTitle, s.colTitleBuy]}>Kjøperscenariet</Text>

              <View style={s.block}>
                <Text style={s.blockTitle}>Grunnlag</Text>
                {[
                  ['Kjøpesum', formatNOK(inputs.purchasePrice, true)],
                  ['Egenkapital', formatNOK(inputs.downPayment, true)],
                  ['Lånebeløp', formatNOK(loanAmount, true)],
                  ['Rente', `${inputs.mortgageRate}%`],
                  ['Løpetid', `${inputs.loanTermYears} år`],
                  ['Felleskostnader', `${formatNOK(inputs.monthlyHoaFee, true)}/mnd`],
                  ['Dokumentavgift', formatNOK(summary.closingCosts, true)],
                ].map(([label, val], i) => (
                  <View key={label} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                    <Text style={s.rowLabel}>{label}</Text>
                    <Text style={s.rowValue}>{val}</Text>
                  </View>
                ))}
              </View>

              <View style={s.block}>
                <Text style={s.blockTitle}>Månedlig lånebetaling (annuitet)</Text>
                <Text style={s.step}>r = {inputs.mortgageRate}% ÷ 12 = {(monthlyRate * 100).toFixed(4)}%/mnd</Text>
                <Text style={s.step}>n = {inputs.loanTermYears} × 12 = {n} betalinger</Text>
                <Text style={s.step}>Betaling = L × r(1+r)^n / ((1+r)^n − 1)</Text>
                <Text style={[s.result, s.resultBuy]}>{formatNOK(summary.monthlyMortgagePayment)}/mnd</Text>
              </View>

              <View style={s.block}>
                <Text style={s.blockTitle}>Månedlig kostnad år 1</Text>
                <View style={[s.row, s.rowAlt]}>
                  <Text style={s.rowLabel}>Lånebetaling</Text>
                  <Text style={s.rowValue}>+ {formatNOK(summary.monthlyMortgagePayment, true)}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.rowLabel}>Felleskostnader</Text>
                  <Text style={s.rowValue}>+ {formatNOK(inputs.monthlyHoaFee, true)}</Text>
                </View>
                {mode === 'advanced' && (
                  <View style={[s.row, s.rowAlt]}>
                    <Text style={s.rowLabel}>Rentefradrag (22%)</Text>
                    <Text style={s.rowValue}>− {formatNOK(loanAmount * monthlyRate * 0.22, true)}</Text>
                  </View>
                )}
                <View style={[s.row, { backgroundColor: COLORS.buyLight }]}>
                  <Text style={[s.rowLabel, { fontWeight: 700 }]}>Totalt per måned</Text>
                  <Text style={[s.rowValue, { color: COLORS.buy }]}>{formatNOK(yearlyData[0].buyerMonthlyCost, true)}</Text>
                </View>
              </View>

              <View style={s.block}>
                <Text style={s.blockTitle}>Kjøpers formue (år {inputs.years})</Text>
                <Text style={s.step}>Boligverdi: {formatNOK(finalYear.homeValue, true)}</Text>
                <Text style={s.step}>− Restgjeld: {formatNOK(finalYear.remainingMortgage, true)}</Text>
                <Text style={s.step}>− Megler: {formatNOK(inputs.brokerSellingFee, true)}</Text>
                <Text style={s.step}>÷ Inflasjonsfaktor: {Math.pow(1 + inputs.inflation / 100, inputs.years).toFixed(3)}</Text>
                <Text style={[s.result, s.resultBuy]}>{formatNOK(summary.finalEquity)}</Text>
              </View>
            </View>

            <View style={s.col}>
              <Text style={[s.colTitle, s.colTitleRent]}>Leierscenariet</Text>

              <View style={s.block}>
                <Text style={s.blockTitle}>Grunnlag</Text>
                {[
                  ['Månedlig leie', `${formatNOK(inputs.monthlyRent, true)}/mnd`],
                  ['Arlig leieokning', `${inputs.rentIncrease}%`],
                  mode === 'advanced'
                    ? ['Sparekonto', `${formatNOK(inputs.savingsAccountBalance, true)} @ ${inputs.savingsAccountRate}%`]
                    : ['Investeringsavkastning', `${inputs.investmentReturn}%`],
                  mode === 'advanced'
                    ? ['ASK-avkastning', `${inputs.askRate}%`]
                    : ['Skatt på avkastning', '37% (auto)'],
                ].map(([label, val], i) => (
                  <View key={label} style={[s.row, i % 2 === 0 ? s.rowAlt : {}]}>
                    <Text style={s.rowLabel}>{label}</Text>
                    <Text style={s.rowValue}>{val}</Text>
                  </View>
                ))}
              </View>

              <View style={s.block}>
                <Text style={s.blockTitle}>Startkapital investert</Text>
                <Text style={s.step}>Egenkapital: {formatNOK(inputs.downPayment, true)}</Text>
                <Text style={s.step}>+ Dokumentavgift: {formatNOK(summary.closingCosts, true)}</Text>
                <Text style={[s.result, s.resultRent]}>{formatNOK(initialInvestment, true)}</Text>
                <Text style={s.stepMuted}>Investeres i markedet istedenfor kjøp</Text>
              </View>

              <View style={s.block}>
                <Text style={s.blockTitle}>Porteføljevekst</Text>
                {mode === 'advanced' ? (
                  <>
                    <Text style={s.step}>Sparekonto: {inputs.savingsAccountRate}% (22% renteskatt automatisk)</Text>
                    <Text style={s.step}>ASK: {inputs.askRate}% (37,84% kun ved uttak)</Text>
                  </>
                ) : (
                  <Text style={s.step}>Avkastning: {inputs.investmentReturn}%/år (37% skatt auto)</Text>
                )}
                <Text style={s.step}>Månedlig diff. (kjøper − leier) → portefølje</Text>
                <Text style={[s.result, s.resultRent]}>{formatNOK(summary.finalRenterPortfolio, true)} etter {inputs.years} år</Text>
              </View>

              <View style={s.block}>
                <Text style={s.blockTitle}>Norske regler brukt</Text>
                <Text style={s.step}>Rentefradrag: 22% av rentekostnader</Text>
                <Text style={s.step}>Inflasjon: {inputs.inflation}%/år</Text>
                {mode === 'advanced' && (
                  <>
                    <Text style={s.step}>Formuesskatt: bolig 25%, bank 100%, ASK 80%</Text>
                    <Text style={s.step}>Bunnfradrag: 1 700 000 kr · Sats: 1,0%</Text>
                  </>
                )}
                <Text style={s.stepMuted}>Alle formuestall i reelle (inflasjonsjusterte) kroner</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>leiexeie.no · {date}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Side ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>År for år</Text>
          <Text style={s.headerSub}>Alle formuestall i reelle kroner – justert for {inputs.inflation}% inflasjon per år</Text>
        </View>

        <View style={s.body}>
          <View style={s.tableHead}>
            <Text style={[s.th, s.thFirst, { flex: 0.35 }]}>År</Text>
            <Text style={[s.th, { flex: 0.9 }]}>Kjøper/mnd</Text>
            <Text style={[s.th, { flex: 0.9 }]}>Leier/mnd</Text>
            <Text style={s.th}>Boligverdi</Text>
            <Text style={s.th}>Restgjeld</Text>
            <Text style={[s.th, { flex: 1.2, color: 'rgba(105,144,212,0.95)' }]}>Kjøpers formue</Text>
            <Text style={[s.th, { flex: 1.2, color: 'rgba(196,146,100,0.95)' }]}>Leiers formue</Text>
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
            <Text style={s.noteTitle}>Notater</Text>
            <Text style={s.noteLine}>· Kjøpers formue = Boligverdi − Restgjeld − Salgsomkostninger, justert for inflasjon</Text>
            <Text style={s.noteLine}>· Leiers formue = Investeringsportefølje etter estimert skatt, justert for inflasjon</Text>
            <Text style={s.noteLine}>· Break-even år: {breakevenYear ? `År ${breakevenYear} – da krysser linjene` : 'Ikke aktuelt i denne perioden'}</Text>
            <Text style={s.noteLine}>· Modellen er veiledende. Konsulter alltid en finansrådgiver ved store beslutninger.</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>leiexeie.no · {date}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Side ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
