import { useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { buildSensitivityGrid, SENSITIVITY_AXES, type SensitivityAxis } from '../utils/sensitivity'
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
  const [axes, setAxes] = useState<{ row: SensitivityAxis; col: SensitivityAxis }>({
    row: 'appreciationRate',
    col: 'mortgageRate',
  })
  const grid = useMemo(
    () => buildSensitivityGrid(inputs, mode, axes.row, axes.col),
    [inputs, mode, axes],
  )

  const setAxis = (which: 'row' | 'col', axis: SensitivityAxis) => {
    setAxes(prev => {
      const other = which === 'row' ? 'col' : 'row'
      if (prev[other] === axis) return { [which]: axis, [other]: prev[which] } as typeof prev
      return { ...prev, [which]: axis }
    })
  }

  const maxAbs = Math.max(1, ...grid.rows.flatMap(r => r.cells.map(c => Math.abs(c.buyAdvantage))))
  const pct = (v: number) => formatPercent(v, locale)
  const axisLabel = (axis: SensitivityAxis) => t(`sensitivity.axes.${axis}`)
  const axisPhrase = { row: axisLabel(axes.row).toLowerCase(), col: axisLabel(axes.col).toLowerCase() }

  const axisSelect = (which: 'row' | 'col') => (
    <label className="sensitivity-axis">
      <span>{t(which === 'row' ? 'sensitivity.rowAxisLabel' : 'sensitivity.colAxisLabel')}</span>
      <select value={axes[which]} onChange={e => setAxis(which, e.target.value as SensitivityAxis)}>
        {SENSITIVITY_AXES.map(axis => (
          <option key={axis} value={axis}>{axisLabel(axis)}</option>
        ))}
      </select>
    </label>
  )

  return (
    <section className="sensitivity" aria-labelledby="sensitivity-title">
      <h3 id="sensitivity-title" className="scenarios-title">{t('sensitivity.title')}</h3>
      <p className="scenarios-subtitle">
        {t('sensitivity.subtitle', { years: inputs.years, ...axisPhrase })}
      </p>

      <div className="sensitivity-axes">
        {axisSelect('row')}
        {axisSelect('col')}
      </div>

      <div className="scenarios-table-wrap">
        <table className="sensitivity-table">
          <caption className="visually-hidden">
            {t('sensitivity.caption', axisPhrase)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sensitivity-corner">
                <span>{axisLabel(axes.row)}</span>
                <span>{axisLabel(axes.col)} →</span>
              </th>
              {grid.colValues.map(value => (
                <th key={value} scope="col" className={value === grid.baseCol ? 'base' : undefined}>
                  {pct(value)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map(row => (
              <tr key={row.value}>
                <th scope="row" className={row.value === grid.baseRow ? 'base' : undefined}>
                  {pct(row.value)}
                </th>
                {row.cells.map(cell => {
                  const winner = cell.buyAdvantage >= 0 ? 'buy' : 'rent'
                  const strength = Math.round(12 + 40 * Math.abs(cell.buyAdvantage) / maxAbs)
                  const isBase = row.value === grid.baseRow && cell.value === grid.baseCol
                  return (
                    <td
                      key={cell.value}
                      className={`sensitivity-cell ${winner}${isBase ? ' current' : ''}`}
                      style={{ '--strength': `${strength}%` } as CSSProperties}
                      title={t(`sensitivity.cellTitle.${winner}`, {
                        amount: formatKr(Math.abs(cell.buyAdvantage)),
                        ...axisPhrase,
                        rowValue: pct(row.value),
                        colValue: pct(cell.value),
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
