import { useAnimatedValue } from '../hooks/useAnimatedValue'
import { formatNOK } from '../utils/formatting'

interface AnimatedNOKProps {
  value: number
  trigger: unknown
  large?: boolean
  locale?: string
}

export function AnimatedNOK({ value, trigger, large, locale }: AnimatedNOKProps) {
  const anim = useAnimatedValue(value, trigger)
  return <span className={`stat-value${large ? ' large' : ''}`}>{formatNOK(anim, false, locale)}</span>
}
