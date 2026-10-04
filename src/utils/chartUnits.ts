import type { YearlyDataPoint } from '../types'

export type ValueUnit = 'real' | 'nominal'

export interface ChartPoint extends YearlyDataPoint {
  netWorthGap: number
}

/**
 * The model reports net worth in today's kroner (deflated to the end of each year),
 * while costs, home value and loan balances are nominal. Costs are paid during the year
 * at that year's price level, so they are deflated by the start-of-year factor.
 */
export function toChartUnits(data: YearlyDataPoint[], inflationPct: number, unit: ValueUnit): ChartPoint[] {
  const g = 1 + inflationPct / 100
  return data.map(d => {
    const endFactor = Math.pow(g, d.year)
    const startFactor = Math.pow(g, d.year - 1)
    const point: YearlyDataPoint =
      unit === 'real'
        ? {
            ...d,
            buyerMonthlyCost: d.buyerMonthlyCost / startFactor,
            renterMonthlyCost: d.renterMonthlyCost / startFactor,
            homeValue: d.homeValue / endFactor,
            remainingMortgage: d.remainingMortgage / endFactor,
            remainingSharedDebt: d.remainingSharedDebt / endFactor,
            buyerPortfolio: d.buyerPortfolio / endFactor,
          }
        : {
            ...d,
            buyerNetWorth: d.buyerNetWorth * endFactor,
            renterNetWorth: d.renterNetWorth * endFactor,
          }
    return { ...point, netWorthGap: point.buyerNetWorth - point.renterNetWorth }
  })
}
