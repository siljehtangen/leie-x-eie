import { describe, expect, it } from 'vitest'
import {
  formatChartNOK,
  formatDecimal,
  formatInputDraft,
  formatInputNum,
  formatNOK,
  formatPct,
  formatPercent,
  getLocale,
  parseInputNum,
} from './formatting'

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
    expect(formatNOK(2_500_000_000, true, 'nb-NO')).toBe('2,5 mrd. kr')
    expect(formatNOK(2_500_000_000, true, 'en-GB')).toBe('2.5bn NOK')
    expect(formatNOK(2_500_000_000_000, true, 'nb-NO')).toBe('2,5 bill. kr')
    expect(formatNOK(-2_500_000_000_000, true, 'en-GB')).toBe('-2.5tn NOK')
  })

  it('formats full amounts without decimals', () => {
    expect(formatNOK(1234.56, false, 'en-GB')).toMatch(/1,235/)
  })

  it('formats percentages with locale decimal separators', () => {
    expect(formatPct(37.84, 'nb-NO')).toBe('37,84')
    expect(formatPct(37.84, 'en-GB')).toBe('37.84')
    expect(formatPct(22, 'en-GB')).toBe('22')
  })

  it('writes the percent sign the Norwegian way with a non-breaking space', () => {
    expect(formatPercent(5.5, 'nb-NO')).toBe('5,5\u00a0%')
    expect(formatPercent(5.5, 'en-GB')).toBe('5.5%')
    expect(formatPercent(0.45833, 'nb-NO', 4)).toBe('0,4583\u00a0%')
  })

  it('formats fixed decimals per locale', () => {
    expect(formatDecimal(1.28, 'nb-NO')).toBe('1,280')
    expect(formatDecimal(1.28, 'en-GB')).toBe('1.280')
  })

  it('groups input digits with narrow spaces', () => {
    expect(formatInputNum(4000000)).toBe('4\u202f000\u202f000')
    expect(formatInputNum(5.5)).toBe('5,5')
    expect(formatInputNum(5.5, 'en-GB')).toBe('5.5')
  })

  it('edits and parses input numbers with either decimal separator', () => {
    expect(formatInputDraft(1234.5, 'nb-NO')).toBe('1234,5')
    expect(formatInputDraft(1234.5, 'en-GB')).toBe('1234.5')
    expect(parseInputNum('5,5')).toBe(5.5)
    expect(parseInputNum('5.5')).toBe(5.5)
    expect(parseInputNum('4\u202f000\u202f000')).toBe(4_000_000)
    expect(parseInputNum('5,')).toBe(5)
    expect(parseInputNum('')).toBe(0)
    expect(parseInputNum('abc')).toBe(0)
  })

  it('abbreviates chart ticks', () => {
    expect(formatChartNOK(1_500_000, 'nb-NO')).toBe('1,5M')
    expect(formatChartNOK(250_000, 'en-GB')).toBe('250k')
    expect(formatChartNOK(2_500_000_000_000, 'nb-NO')).toBe('2,5T')
  })
})
