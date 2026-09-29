import { describe, expect, it } from 'vitest'
import { formatChartNOK, formatInputNum, formatNOK, formatPct, getLocale } from './formatting'

describe('formatting', () => {
  it('maps UI languages to number locales', () => {
    expect(getLocale('en')).toBe('en-GB')
    expect(getLocale('en-US')).toBe('en-GB')
    expect(getLocale('no')).toBe('nb-NO')
  })

  it('formats compact amounts per locale', () => {
    expect(formatNOK(2_450_000, true, 'nb-NO')).toBe('2,5 mill. kr')
    expect(formatNOK(2_450_000, true, 'en-GB')).toBe('2.5m NOK')
    expect(formatNOK(12_400, true, 'en-GB')).toBe('12k NOK')
  })

  it('formats full amounts without decimals', () => {
    expect(formatNOK(1234.56, false, 'en-GB')).toMatch(/1,235/)
  })

  it('formats percentages with locale decimal separators', () => {
    expect(formatPct(37.84, 'nb-NO')).toBe('37,84')
    expect(formatPct(37.84, 'en-GB')).toBe('37.84')
    expect(formatPct(22, 'en-GB')).toBe('22')
  })

  it('groups input digits with narrow spaces', () => {
    expect(formatInputNum(4000000)).toBe('4\u202f000\u202f000')
    expect(formatInputNum(5.5)).toBe('5.5')
  })

  it('abbreviates chart ticks', () => {
    expect(formatChartNOK(1_500_000, 'nb-NO')).toBe('1,5M')
    expect(formatChartNOK(250_000, 'en-GB')).toBe('250k')
  })
})
