import { useEffect, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown } from 'lucide-react'
import { useFormatNOK } from '../hooks/useFormatNOK'
import type { CalculationResult } from '../types'

interface StickySummaryProps {
  result: CalculationResult
  years: number
  targetRef: RefObject<HTMLElement | null>
  onJump: () => void
}

export default function StickySummary({ result, years, targetRef, onJump }: StickySummaryProps) {
  const { t } = useTranslation()
  const formatKr = useFormatNOK()
  const [targetVisible, setTargetVisible] = useState(true)

  useEffect(() => {
    const el = targetRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -35% 0px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [targetRef])

  const { recommendation, difference, breakevenYear } = result
  const winner = t(recommendation === 'buy' ? 'sticky.buyWins' : 'sticky.rentWins')

  return (
    <div className={`sticky-summary${targetVisible ? '' : ' visible'}`} aria-hidden={targetVisible}>
      <button type="button" className="sticky-summary-btn" onClick={onJump} tabIndex={targetVisible ? -1 : 0}>
        <span className={`sticky-summary-dot ${recommendation}`} aria-hidden />
        <span className="sticky-summary-main">
          {winner} <strong>{formatKr(difference, true)}</strong>
        </span>
        <span className="sticky-summary-meta">
          {breakevenYear !== null ? t('sticky.breakeven', { year: breakevenYear }) : t('sticky.afterYears', { years })}
        </span>
        <span className="sticky-summary-arrow" aria-hidden>
          <ArrowDown size={14} strokeWidth={2.25} />
        </span>
      </button>
    </div>
  )
}
