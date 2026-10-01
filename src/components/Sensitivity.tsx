import { useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { buildSensitivityGrid } from '../utils/sensitivity'
import { useFormatNOK } from '../hooks/useFormatNOK'
import { useLocale } from '../hooks/useLocale'
import { formatPercent } from '../utils/formatting'
import type { Inputs, Mode } from '../types'

interface SensitivityProps {
  inputs: Inputs
  mode: Mode
}

export default function Sensitivity({ inputs, mode }: SensitivityProps) {
  const { t } = useTranslation()
  const formatKr = useFormatNOK()
  const locale = useLocale()
  const grid = useMemo(() => buildSensitivityGrid(inputs, mode), [inputs, mode])

  const maxAbs = Math.max(1, ...grid.rows.flatMap(r => r.cells.map(c => Math.abs(c.buyAdvantage))))
  const pct = (v: number) => formatPercent(v, locale)

  return (
    <section className="sensitivity" aria-labelledby="sensitivity-title">
      <h3 id="sensitivity-title" className="scenarios-title">{t('sensitivity.title')}</h3>
      <p className="scenarios-subtitle">{t('sensitivity.subtitle', { years: inputs.years })}</p>

      <div className="scenarios-table-wrap">
        <table className="sensitivity-table">
          <caption className="visually-hidden">{t('sensitivity.caption')}</caption>
          <thead>
            <tr>
              <th scope="col" className="sensitivity-corner">
                <span>{t('sensitivity.rowAxis')}</span>
                <span>{t('sensitivity.colAxis')} →</span>
              </th>
              {grid.mortgageRates.map(rate => (
                <th key={rate} scope="col" className={rate === grid.baseMortgageRate ? 'base' : undefined}>
                  {pct(rate)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map(row => (
              <tr key={row.appreciationRate}>
                <th scope="row" className={row.appreciationRate === grid.baseAppreciation ? 'base' : undefined}>
                  {pct(row.appreciationRate)}
                </th>
                {row.cells.map(cell => {
                  const winner = cell.buyAdvantage >= 0 ? 'buy' : 'rent'
                  const strength = Math.round(12 + 40 * Math.abs(cell.buyAdvantage) / maxAbs)
                  const isBase = row.appreciationRate === grid.baseAppreciation && cell.mortgageRate === grid.baseMortgageRate
                  return (
                    <td
                      key={cell.mortgageRate}
                      className={`sensitivity-cell ${winner}${isBase ? ' current' : ''}`}
                      style={{ '--strength': `${strength}%` } as CSSProperties}
                      title={t(`sensitivity.cellTitle.${winner}`, {
                        amount: formatKr(Math.abs(cell.buyAdvantage)),
                        appreciation: pct(row.appreciationRate),
                        rate: pct(cell.mortgageRate),
                      })}
                    >
                      <span className="sensitivity-winner">{t(`results.${winner}`)}</span>
                      <span className="sensitivity-amount">{formatKr(Math.abs(cell.buyAdvantage), true)}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="scenarios-hint">{t('sensitivity.note')}</p>
    </section>
  )
}
