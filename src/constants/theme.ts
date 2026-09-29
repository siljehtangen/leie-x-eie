export const COLORS = {
  buy: '#2D4C99',
  buyMid: '#7B96D6',
  buyDark: '#1A2C5E',
  buyLight: '#EEF2FA',
  rent: '#BE5433',
  rentMid: '#DC8663',
  rentDark: '#86351A',
  rentLight: '#FBF0EA',
  time: '#2A7A60',
  timeLight: '#E9F3EF',
  financial: '#6A4A9E',
  financialLight: '#F1EDF8',
  text: '#15151C',
  textSecondary: '#4D4D59',
  textMuted: '#8C8A94',
  bg: '#F6F4EF',
  bgHover: '#EFECE5',
  surface: '#FFFFFF',
  border: '#E7E3DB',
  borderStrong: '#C8C1B5',
  dark: '#0B0B12',
  breakeven: '#DDA843',
  breakevenDark: '#A87618',
  chartGrid: '#EFECE6',
  chartAxis: '#9A968E',
  chartAxisLabel: '#B9B4AB',
  chartZeroLine: '#C6C0B6',
  mortgageLine: '#5B6171',
} as const

export type ColorKey = keyof typeof COLORS

export function cssVarName(key: ColorKey): string {
  return `--color-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`
}

export function applyThemeVars(root: HTMLElement = document.documentElement): void {
  for (const key of Object.keys(COLORS) as ColorKey[]) {
    root.style.setProperty(cssVarName(key), COLORS[key])
  }
}
