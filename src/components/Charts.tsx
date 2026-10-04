import { useMemo, useCallback, useState } from 'react'
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
import { toChartUnits, type ValueUnit } from '../utils/chartUnits'
import { useLocale } from '../hooks/useLocale'
import { useTheme } from '../hooks/useTheme'
import type { YearlyDataPoint } from '../types'

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
  inflation: number
}

export default function Charts({ yearlyData, breakevenYear, inflation }: ChartsProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { colors } = useTheme()
  const [unit, setUnit] = useState<ValueUnit>('real')
  const tickFormatter = useCallback((v: number) => formatChartNOK(v, locale), [locale])

  const data = useMemo(() => toChartUnits(yearlyData, inflation, unit), [yearlyData, inflation, unit])

  const activeDot = { r: 4.5, strokeWidth: 2, stroke: colors.surface }
  const tooltipCursor = { stroke: colors.borderStrong, strokeDasharray: '3 3' }
  const tooltip = <Tooltip content={<CustomTooltip t={t} locale={locale} />} cursor={tooltipCursor} />
  const unitTag = (
    <span className="chart-unit-tag">{t(unit === 'real' ? 'charts.unitRealShort' : 'charts.unitNominalShort')}</span>
  )

  const xAxisProps = {
    dataKey: 'year' as const,
    tick: { fontSize: 11, fill: colors.chartAxis },
    tickLine: false,
    axisLine: false,
    label: {
      value: t('results.year'),
      position: 'insideBottomRight' as const,
      offset: -5,
      fontSize: 11,
      fill: colors.chartAxisLabel,
    },
  }

  const yAxisProps = {
    tickFormatter,
    tick: { fontSize: 11, fill: colors.chartAxis },
    tickLine: false,
    axisLine: false,
    width: 52,
  }

  const breakevenLine = breakevenYear && (
    <ReferenceLine
      x={breakevenYear}
      stroke={colors.breakeven}
      strokeDasharray="4 4"
      label={{
        value: t('results.chartBreakevenLabel', { year: breakevenYear }),
        fontSize: 10,
        fill: colors.breakevenDark,
        position: 'top',
      }}
    />
  )

  return (
    <section className="results-block" aria-labelledby="charts-heading">
      <div className="results-block-head">
        <div>
          <h3 id="charts-heading" className="results-block-title">
            {t('charts.title')}
          </h3>
          <p className="results-block-subtitle">
            {t(unit === 'real' ? 'charts.unitRealNote' : 'charts.unitNominalNote')}
          </p>
        </div>
        <div className="segmented" role="group" aria-label={t('charts.unitGroupLabel')}>
          {(['real', 'nominal'] as const).map(u => (
            <button
              key={u}
              type="button"
              className={`segmented-btn${unit === u ? ' active' : ''}`}
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
            >
              {t(u === 'real' ? 'charts.unitReal' : 'charts.unitNominal')}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <div className="chart-card-title">
            <span className="chart-card-icon">
              <BarChart2 size={15} color={colors.buy} strokeWidth={2.25} aria-hidden />
            </span>
            {t('results.netWorthOverTime')}
            {unitTag}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 18, right: 8, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradBuy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.buy} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={colors.buy} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradRent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.rent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={colors.rent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={colors.chartGrid} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              {tooltip}
              {breakevenLine}
              <Area
                type="monotone"
                dataKey="buyerNetWorth"
                name={t('results.buyerNetWorth')}
                stroke={colors.buy}
                strokeWidth={2.5}
                fill="url(#gradBuy)"
                dot={false}
                activeDot={activeDot}
              />
              <Area
                type="monotone"
                dataKey="renterNetWorth"
                name={t('results.renterNetWorth')}
                stroke={colors.rent}
                strokeWidth={2.5}
                fill="url(#gradRent)"
                dot={false}
                activeDot={activeDot}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.buy }} />
              {t('results.buyerNetWorth')}
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.rent }} />
              {t('results.renterNetWorth')}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">
            <span className="chart-card-icon">
              <TrendingDown size={15} color={colors.rent} strokeWidth={2.25} aria-hidden />
            </span>
            {t('results.monthlyCostOverTime')}
            {unitTag}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 18, right: 8, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.chartGrid} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              {tooltip}
              <Line
                type="monotone"
                dataKey="buyerMonthlyCost"
                name={t('results.buyCosts')}
                stroke={colors.buy}
                strokeWidth={2.5}
                dot={false}
                activeDot={activeDot}
              />
              <Line
                type="monotone"
                dataKey="renterMonthlyCost"
                name={t('results.rentCosts')}
                stroke={colors.rent}
                strokeWidth={2.5}
                dot={false}
                activeDot={activeDot}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.buy }} />
              {t('results.buyCosts')}
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.rent }} />
              {t('results.rentCosts')}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">
            <span className="chart-card-icon">
              <Scale size={15} color={colors.time} strokeWidth={2.25} aria-hidden />
            </span>
            {t('results.netWorthGapTitle')}
            {unitTag}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 18, right: 8, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.chartGrid} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              {tooltip}
              <ReferenceLine y={0} stroke={colors.chartZeroLine} strokeWidth={1.5} />
              {breakevenLine}
              <Line
                type="monotone"
                dataKey="netWorthGap"
                name={t('results.netWorthGapSeries')}
                stroke={colors.time}
                strokeWidth={2.5}
                dot={false}
                activeDot={activeDot}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.time }} />
              {t('results.netWorthGapSeries')}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">
            <span className="chart-card-icon">
              <Landmark size={15} color={colors.buy} strokeWidth={2.25} aria-hidden />
            </span>
            {t('results.homeAndLoanTitle')}
            {unitTag}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 18, right: 8, bottom: 5, left: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.chartGrid} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              {tooltip}
              <Line
                type="monotone"
                dataKey="homeValue"
                name={t('results.homeValue')}
                stroke={colors.buy}
                strokeWidth={2.5}
                dot={false}
                activeDot={activeDot}
              />
              <Line
                type="monotone"
                dataKey="remainingMortgage"
                name={t('results.loanBalanceSeries')}
                stroke={colors.mortgageLine}
                strokeWidth={2.5}
                dot={false}
                activeDot={activeDot}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.buy }} />
              {t('results.homeValue')}
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: colors.mortgageLine }} />
              {t('results.loanBalanceSeries')}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
