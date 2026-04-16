import { useMemo, useCallback } from 'react'
import type { TFunction } from 'i18next'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { BarChart2, TrendingDown, Scale, Landmark } from 'lucide-react'
import { formatNOK, formatChartNOK } from '../utils/formatting'
import { useLocale } from '../hooks/useLocale'
import { COLORS } from '../constants/theme'
import type { YearlyDataPoint } from '../types'

const RENT_COLOR = COLORS.rent
const BUY_COLOR  = COLORS.buy
const MORTGAGE_LINE = '#5A6270'
const GAP_LINE = COLORS.time


interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number
  t: TFunction
  locale: string
}

function CustomTooltip({ active, payload, label, t, locale }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">
        {t('results.year')} {label}
      </div>
      {payload.map(p => (
        <div key={p.name} className="chart-tooltip-row">
          <span className="chart-tooltip-swatch" style={{ background: p.color }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-value">{formatNOK(p.value, false, locale)}</span>
        </div>
      ))}
    </div>
  )
}

interface ChartsProps {
  yearlyData: YearlyDataPoint[]
  breakevenYear: number | null
}

export default function Charts({ yearlyData, breakevenYear }: ChartsProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const tickFormatter = useCallback((v: number) => formatChartNOK(v, locale), [locale])

  const gapData = useMemo(
    () =>
      yearlyData.map(d => ({
        ...d,
        netWorthGap: d.buyerNetWorth - d.renterNetWorth,
      })),
    [yearlyData],
  )

  const xAxisProps = {
    dataKey: 'year' as const,
    tick: { fontSize: 11, fill: '#999' },
    tickLine: false,
    axisLine: false,
    label: { value: t('results.year'), position: 'insideBottomRight' as const, offset: -5, fontSize: 11, fill: '#bbb' },
  }

  const yAxisProps = {
    tickFormatter,
    tick: { fontSize: 11, fill: '#999' },
    tickLine: false,
    axisLine: false,
    width: 52,
  }

  return (
    <div className="charts-section">
      <div className="chart-card">
        <div className="chart-card-title">
          <BarChart2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: COLORS.buy }} />
          {t('results.netWorthOverTime')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={yearlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="gradBuy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.buy}  stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS.buy}  stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradRent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.rent} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS.rent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip t={t} locale={locale} />} />
            {breakevenYear && (
              <ReferenceLine
                x={breakevenYear}
                stroke={COLORS.breakeven}
                strokeDasharray="5 3"
                label={{ value: t('results.chartBreakevenLabel', { year: breakevenYear }), fontSize: 10, fill: COLORS.breakevenDark, position: 'top' }}
              />
            )}
            <Area type="monotone" dataKey="buyerNetWorth"  name={t('results.buyerNetWorth')}  stroke={COLORS.buy}  strokeWidth={2.5} fill="url(#gradBuy)"  dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="renterNetWorth" name={t('results.renterNetWorth')} stroke={COLORS.rent} strokeWidth={2.5} fill="url(#gradRent)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: COLORS.buy }} />{t('results.buyerNetWorth')}</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: COLORS.rent }} />{t('results.renterNetWorth')}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-title">
          <TrendingDown size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: COLORS.rent }} />
          {t('results.monthlyCostOverTime')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip t={t} locale={locale} />} />
            <Line type="monotone" dataKey="buyerMonthlyCost"  name={t('results.buyCosts')}  stroke={BUY_COLOR}  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="renterMonthlyCost" name={t('results.rentCosts')} stroke={RENT_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: COLORS.buy }} />{t('results.buyCosts')}</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: COLORS.rent }} />{t('results.rentCosts')}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-title">
          <Scale size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: GAP_LINE }} />
          {t('results.netWorthGapTitle')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={gapData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip t={t} locale={locale} />} />
            <ReferenceLine y={0} stroke="#B8B8C0" strokeWidth={1.5} />
            {breakevenYear && (
              <ReferenceLine
                x={breakevenYear}
                stroke={COLORS.breakeven}
                strokeDasharray="5 3"
                label={{ value: t('results.chartBreakevenLabel', { year: breakevenYear }), fontSize: 10, fill: COLORS.breakevenDark, position: 'top' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="netWorthGap"
              name={t('results.netWorthGapSeries')}
              stroke={GAP_LINE}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: GAP_LINE }} />{t('results.netWorthGapSeries')}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-title">
          <Landmark size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: BUY_COLOR }} />
          {t('results.homeAndLoanTitle')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip t={t} locale={locale} />} />
            <Line type="monotone" dataKey="homeValue" name={t('results.homeValue')} stroke={BUY_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="remainingMortgage" name={t('results.loanBalanceSeries')} stroke={MORTGAGE_LINE} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: BUY_COLOR }} />{t('results.homeValue')}</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: MORTGAGE_LINE }} />{t('results.loanBalanceSeries')}</div>
        </div>
        <p className="chart-footnote">{t('results.nominalChartNote')}</p>
      </div>
    </div>
  )
}
