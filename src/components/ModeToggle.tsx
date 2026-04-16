import { useTranslation } from 'react-i18next'
import { Zap, SlidersHorizontal } from 'lucide-react'
import type { Mode } from '../types'

interface ModeToggleProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const { t } = useTranslation()

  return (
    <div className="mode-toggle-wrap">
      <div className="mode-toggle" role="group" aria-label={t('mode.groupLabel')}>
        <button
          type="button"
          className={`mode-btn ${mode === 'quick' ? 'active' : ''}`}
          onClick={() => onModeChange('quick')}
          aria-pressed={mode === 'quick'}
        >
          <Zap size={15} aria-hidden /> {t('mode.quick')}
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'advanced' ? 'active' : ''}`}
          onClick={() => onModeChange('advanced')}
          aria-pressed={mode === 'advanced'}
        >
          <SlidersHorizontal size={15} aria-hidden /> {t('mode.advanced')}
        </button>
      </div>
      <p className="mode-desc">
        {mode === 'quick' ? t('mode.quickDesc') : t('mode.advancedDesc')}
      </p>
    </div>
  )
}
