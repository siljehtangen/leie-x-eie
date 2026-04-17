import type { YearlyDataPoint } from '../../types'

type FormatFn = (value: number, compact?: boolean) => string
type TFn = (key: string, opts?: Record<string, unknown>) => string

interface YearlyTableProps {
  t: TFn
  formatKr: FormatFn
  yearlyData: YearlyDataPoint[]
}

export default function YearlyTable({ t, formatKr, yearlyData }: YearlyTableProps) {
  return (
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
                  <td>{formatKr(row.buyerMonthlyCost)}</td>
                  <td>{formatKr(row.renterMonthlyCost)}</td>
                  <td>{formatKr(row.homeValue, true)}</td>
                  <td>{formatKr(row.remainingMortgage, true)}</td>
                  <td className={buyerWins ? 'bd-winner-buy' : ''}>{formatKr(row.buyerNetWorth, true)}</td>
                  <td className={!buyerWins ? 'bd-winner-rent' : ''}>{formatKr(row.renterNetWorth, true)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="bd-table-note">{t('breakdown.tableNote')}</p>
    </div>
  )
}
