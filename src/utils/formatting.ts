export function getLocale(language: string): string {
  return language.startsWith('en') ? 'en-GB' : 'nb-NO'
}

function decimalSeparator(locale: string): string {
  return locale.startsWith('en') ? '.' : ','
}

export function formatInputNum(v: number, locale = 'nb-NO'): string {
  const parts = v.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return parts.join(decimalSeparator(locale))
}

/** Ungrouped value for editing, with the locale's decimal separator. */
export function formatInputDraft(v: number, locale = 'nb-NO'): string {
  return v.toString().replace('.', decimalSeparator(locale))
}

/** Accepts both comma and point as decimal separator, ignoring digit grouping. */
export function parseInputNum(raw: string): number {
  const cleaned = raw.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.')
  const v = cleaned === '' ? 0 : parseFloat(cleaned)
  return isNaN(v) ? 0 : v
}

function compactScaled(value: number, divisor: number, locale: string, suffix: string): string {
  const n = (value / divisor).toFixed(1)
  const num = locale.startsWith('en') ? n : n.replace('.', ',')
  return `${num}${suffix}`
}

export function formatNOK(value: number, compact = false, locale = 'nb-NO'): string {
  if (compact) {
    const en = locale.startsWith('en')
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000_000) return compactScaled(value, 1_000_000_000_000, locale, en ? 'tn NOK' : ' bill. kr')
    if (abs >= 1_000_000_000) return compactScaled(value, 1_000_000_000, locale, en ? 'bn NOK' : ' mrd. kr')
    if (abs >= 1_000_000) return compactScaled(value, 1_000_000, locale, en ? 'm NOK' : ' mill. kr')
    if (abs >= 1_000) {
      const k = Math.round(value / 1_000)
      return en ? `${k}k NOK` : `${k} 000 kr`
    }
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPct(value: number, locale = 'nb-NO', maxDecimals = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxDecimals }).format(value)
}

/** Norwegian writes a (non-breaking) space before the percent sign; English does not. */
export function formatPercent(value: number, locale = 'nb-NO', maxDecimals = 2): string {
  const space = locale.startsWith('en') ? '' : '\u00a0'
  return `${formatPct(value, locale, maxDecimals)}${space}%`
}

export function formatDecimal(value: number, locale = 'nb-NO', decimals = 3): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatChartNOK(value: number, locale = 'nb-NO'): string {
  const dec = locale.startsWith('en') ? '.' : ','
  const abs = Math.abs(value)
  const scaled = (divisor: number, suffix: string) => `${(value / divisor).toFixed(1).replace('.', dec)}${suffix}`
  if (abs >= 1_000_000_000_000) return scaled(1_000_000_000_000, 'T')
  if (abs >= 1_000_000_000) return scaled(1_000_000_000, 'B')
  if (abs >= 1_000_000) return scaled(1_000_000, 'M')
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}`
}
