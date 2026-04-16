export function getLocale(language: string): string {
  return language.startsWith('en') ? 'en-GB' : 'nb-NO'
}

export function formatInputNum(v: number): string {
  const parts = v.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return parts.join('.')
}

export function formatNOK(value: number, compact = false, locale = 'nb-NO'): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      const n = (value / 1_000_000).toFixed(1)
      const num = locale.startsWith('en') ? n : n.replace('.', ',')
      return locale.startsWith('en') ? `${num}m NOK` : `${num} mill. kr`
    }
    if (Math.abs(value) >= 1_000) {
      const k = Math.round(value / 1_000)
      return locale.startsWith('en') ? `${k}k NOK` : `${k} 000 kr`
    }
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatChartNOK(value: number, locale = 'nb-NO'): string {
  const dec = locale.startsWith('en') ? '.' : ','
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', dec)}M`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}`
}
