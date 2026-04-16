import { useTranslation } from 'react-i18next'
import { getLocale } from '../utils/formatting'

export function useLocale(): string {
  const { i18n } = useTranslation()
  return getLocale(i18n.language)
}
