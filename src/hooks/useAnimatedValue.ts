import { useEffect, useState } from 'react'

const DURATION_MS = 900

export function useAnimatedValue(target: number, trigger: unknown): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const startTime = performance.now()
    let rafId = 0
    const animate = (now: number) => {
      const progress = target === 0 ? 1 : Math.min((now - startTime) / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, trigger])
  return value
}
