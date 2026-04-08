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
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'quick' ? 'active' : ''}`}
          onClick={() => onModeChange('quick')}
        >
          <Zap size={15} /> {t('mode.quick')}
        </button>
        <button
          className={`mode-btn ${mode === 'advanced' ? 'active' : ''}`}
          onClick={() => onModeChange('advanced')}
        >
          <SlidersHorizontal size={15} /> {t('mode.advanced')}
        </button>
      </div>
      <p className="mode-desc">
        {mode === 'quick' ? t('mode.quickDesc') : t('mode.advancedDesc')}
      </p>
    </div>
  )
}
