import { useEffect, useState } from 'react'
import { formatNOK } from '../utils/calculations'

export function useAnimatedValue(target: number, trigger: number): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    setValue(0)
    if (target === 0) return
    const duration = 900
    const startTime = performance.now()
    let rafId: number
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, trigger])
  return value
}

interface AnimatedNOKProps {
  value: number
  trigger: number
  large?: boolean
  locale?: string
}

export function AnimatedNOK({ value, trigger, large, locale }: AnimatedNOKProps) {
  const anim = useAnimatedValue(value, trigger)
  return <span className={`stat-value${large ? ' large' : ''}`}>{formatNOK(anim, false, locale)}</span>
}
