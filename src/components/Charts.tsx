import { useMemo } from 'react'
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
import { formatNOK, formatChartNOK } from '../utils/calculations'
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
  t: (key: string) => string
}

function CustomTooltip({ active, payload, label, t }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e8e8e8',
      borderRadius: 12,
      padding: '0.75rem 1.1rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: '0.85rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#333' }}>
        {t('results.year')} {label}
      </div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#666' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#333' }}>{formatNOK(p.value)}</span>
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

  const gapData = useMemo(
    () =>
      yearlyData.map(d => ({
        ...d,
        netWorthGap: d.buyerNetWorth - d.renterNetWorth,
      })),
    [yearlyData],
  )

  return (
    <div className="charts-section">
      <div className="chart-card">
        <div className="chart-card-title">
          <BarChart2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: BUY_COLOR }} />
          {t('results.netWorthOverTime')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={yearlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="gradBuy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BUY_COLOR}  stopOpacity={0.25} />
                <stop offset="95%" stopColor={BUY_COLOR}  stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradRent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={RENT_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={RENT_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              label={{ value: t('results.year'), position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#bbb' }}
            />
            <YAxis
              tickFormatter={formatChartNOK}
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            {breakevenYear && (
              <ReferenceLine
                x={breakevenYear}
                stroke={COLORS.breakeven}
                strokeDasharray="5 3"
                label={{ value: `↔ yr ${breakevenYear}`, fontSize: 10, fill: COLORS.breakevenDark, position: 'top' }}
              />
            )}
            <Area type="monotone" dataKey="buyerNetWorth"  name={t('results.buyerNetWorth')}  stroke={BUY_COLOR}  strokeWidth={2.5} fill="url(#gradBuy)"  dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="renterNetWorth" name={t('results.renterNetWorth')} stroke={RENT_COLOR} strokeWidth={2.5} fill="url(#gradRent)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: BUY_COLOR }} />{t('results.buyerNetWorth')}</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: RENT_COLOR }} />{t('results.renterNetWorth')}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-title">
          <TrendingDown size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: RENT_COLOR }} />
          {t('results.monthlyCostOverTime')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              label={{ value: t('results.year'), position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#bbb' }}
            />
            <YAxis
              tickFormatter={formatChartNOK}
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Line type="monotone" dataKey="buyerMonthlyCost"  name={t('results.buyCosts')}  stroke={BUY_COLOR}  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="renterMonthlyCost" name={t('results.rentCosts')} stroke={RENT_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: BUY_COLOR }} />{t('results.buyCosts')}</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: RENT_COLOR }} />{t('results.rentCosts')}</div>
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
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              label={{ value: t('results.year'), position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#bbb' }}
            />
            <YAxis
              tickFormatter={formatChartNOK}
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <ReferenceLine y={0} stroke="#B8B8C0" strokeWidth={1.5} />
            {breakevenYear && (
              <ReferenceLine
                x={breakevenYear}
                stroke={COLORS.breakeven}
                strokeDasharray="5 3"
                label={{ value: `↔ yr ${breakevenYear}`, fontSize: 10, fill: COLORS.breakevenDark, position: 'top' }}
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
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              label={{ value: t('results.year'), position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#bbb' }}
            />
            <YAxis
              tickFormatter={formatChartNOK}
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
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
