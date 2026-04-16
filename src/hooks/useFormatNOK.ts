import { useCallback } from 'react'
import { formatNOK } from '../utils/formatting'
import { useLocale } from './useLocale'

export function useFormatNOK(): (value: number, compact?: boolean) => string {
  const locale = useLocale()
  return useCallback(
    (value: number, compact = false) => formatNOK(value, compact, locale),
    [locale],
  )
}
