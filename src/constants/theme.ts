export const COLORS = {
  buy: '#2952A3',
  buyMid: '#6B90D4',
  buyDark: '#1E3D7A',
  buyLight: '#EDF2FA',
  rent: '#C4522E',
  rentMid: '#D4724E',
  rentDark: '#9A3A1E',
  rentLight: '#FCF1EC',
  time: '#1F7A5E',
  timeLight: '#EAF4F0',
  financial: '#6B3FA0',
  financialLight: '#F2EDF8',
  text: '#1A1A22',
  textSecondary: '#52525E',
  textMuted: '#94949E',
  bg: '#F5F2EC',
  bgHover: '#EFECE6',
  surface: '#FFFFFF',
  border: '#E5E2DB',
  borderStrong: '#B0AAA0',
  dark: '#0E0E16',
  breakeven: '#E8B84B',
  breakevenDark: '#B8881B',
  chartGrid: '#F0F0F0',
  chartAxis: '#999999',
  chartAxisLabel: '#BBBBBB',
  chartZeroLine: '#B8B8C0',
  mortgageLine: '#5A6270',
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
