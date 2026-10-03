export type Theme = 'light' | 'dark'

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
  onText: '#FFFFFF',
  ink: '#15151C',
  textSecondary: '#4D4D59',
  textMuted: '#6B6870',
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
export type Palette = Record<ColorKey, string>

export const DARK_COLORS: Palette = {
  buy: '#5A7BD0',
  buyMid: '#8FA7E4',
  buyDark: '#22386F',
  buyLight: '#1C2438',
  rent: '#CF6847',
  rentMid: '#E39A7A',
  rentDark: '#8E3B1F',
  rentLight: '#2E1F1A',
  time: '#45A383',
  timeLight: '#18291F',
  financial: '#9479C8',
  financialLight: '#241D33',
  text: '#ECEAE5',
  onText: '#121218',
  ink: '#15151C',
  textSecondary: '#B4B1AA',
  textMuted: '#85828B',
  bg: '#0F0F14',
  bgHover: '#1D1D25',
  surface: '#17171E',
  border: '#2A2A33',
  borderStrong: '#45434D',
  dark: '#1B1B26',
  breakeven: '#E2B358',
  breakevenDark: '#E8BE6A',
  chartGrid: '#24242C',
  chartAxis: '#85828B',
  chartAxisLabel: '#5F5D66',
  chartZeroLine: '#45434D',
  mortgageLine: '#9AA0B2',
}

export function paletteFor(theme: Theme): Palette {
  return theme === 'dark' ? DARK_COLORS : COLORS
}

export function cssVarName(key: ColorKey): string {
  return `--color-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`
}

export function applyThemeVars(theme: Theme = 'light', root: HTMLElement = document.documentElement): void {
  const palette = paletteFor(theme)
  for (const key of Object.keys(COLORS) as ColorKey[]) {
    root.style.setProperty(cssVarName(key), palette[key])
  }
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.bg)
}
