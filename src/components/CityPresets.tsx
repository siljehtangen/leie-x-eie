import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { CITY_PRESETS, type PresetValues } from '../constants/presets'
import { matchesPreset } from '../utils/inputUpdates'
import type { Inputs } from '../types'

interface CityPresetsProps {
  inputs: Inputs
  onApply: (values: PresetValues) => void
}

export default function CityPresets({ inputs, onApply }: CityPresetsProps) {
  const { t } = useTranslation()

  return (
    <div className="presets">
      <div className="presets-row" role="group" aria-label={t('presets.groupLabel')}>
        <span className="presets-label">
          <MapPin size={14} aria-hidden /> {t('presets.label')}
        </span>
        {CITY_PRESETS.map(preset => {
          const active = matchesPreset(inputs, preset.values)
          return (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip${active ? ' active' : ''}`}
              aria-pressed={active}
              onClick={() => onApply(preset.values)}
            >
              {preset.name}
            </button>
          )
        })}
      </div>
      <p className="presets-note">{t('presets.note')}</p>
    </div>
  )
}
