import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Home,
  House,
  TrendingUp,
  Wallet,
  ChevronDown,
  Info,
} from 'lucide-react'
import { formatInputNum } from '../utils/calculations'
import { COLORS } from '../constants/theme'
import { BSU_MAX_CONTRIBUTION } from '../constants/finance'
import type { Inputs, Mode } from '../types'

interface InputFieldProps {
  label: string
  name: keyof Inputs
  value: number
  onChange: (name: keyof Inputs, value: number) => void
  unit?: string
  tooltip?: string
  min?: number
  max?: number
  step?: number
}

function InputField({ label, name, value, onChange, unit, tooltip, min, max, step }: InputFieldProps) {
  const { t: tA11y } = useTranslation()
  const [focused, setFocused] = useState(false)
  const s = step ?? 1

  const increment = () => {
    const next = parseFloat((value + s).toFixed(10))
    onChange(name, max !== undefined ? Math.min(next, max) : next)
  }

  const decrement = () => {
    const next = parseFloat((value - s).toFixed(10))
    onChange(name, min !== undefined ? Math.max(next, min) : next)
  }

  return (
    <div className="input-field">
      <div className="input-label">
        {label}
        {tooltip && (
          <span className="tooltip-icon">
            <Info size={13} />
            <span className="tooltip-popup">{tooltip}</span>
          </span>
        )}
      </div>
      <div className="input-value-row">
        <button className="input-stepper-btn" onClick={decrement} tabIndex={-1} type="button" aria-label={tA11y('a11y.decreaseField', { label })}>−</button>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-label={label}
          value={focused ? value : formatInputNum(value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => {
            const raw = e.target.value.replace(/[\s\u202f]/g, '').replace(',', '.')
            const v = raw === '' ? 0 : parseFloat(raw)
            onChange(name, isNaN(v) ? 0 : v)
          }}
        />
        {unit && <span className="input-unit">{unit}</span>}
        <button className="input-stepper-btn" onClick={increment} tabIndex={-1} type="button" aria-label={tA11y('a11y.increaseField', { label })}>+</button>
      </div>
    </div>
  )
}

interface SectionProps {
  id: string
  title: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  iconColor: string
  stripe: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function CheckboxField({ label, name, value, onChange, tooltip }: {
  label: string
  name: keyof Inputs
  value: number
  onChange: (name: keyof Inputs, value: number) => void
  tooltip?: string
}) {
  return (
    <div className="input-field">
      <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={value === 1}
          onChange={e => onChange(name, e.target.checked ? 1 : 0)}
          style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: 'var(--color-buy, #4CAF50)', flexShrink: 0 }}
        />
        <span>{label}</span>
        {tooltip && (
          <span className="tooltip-icon">
            <Info size={13} />
            <span className="tooltip-popup">{tooltip}</span>
          </span>
        )}
      </label>
    </div>
  )
}

function Section({ id, title, icon: Icon, iconColor, stripe, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = `section-body-${id}`
  return (
    <div className="input-section">
      <div className={`section-stripe stripe-${stripe}`} />
      <div
        className="section-header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
      >
        <div className={`section-icon ${id}`}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </div>
        <span className="section-title">{title}</span>
        <ChevronDown
          size={16}
          color="#9E9E9E"
          strokeWidth={2}
          style={{ marginLeft: '0.5rem', transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
      {open && <div id={bodyId} className="section-body" role="region" aria-label={title}>{children}</div>}
    </div>
  )
}

interface InputPanelProps {
  inputs: Inputs
  onInputChange: (name: keyof Inputs, value: number) => void
  mode: Mode
}

export default function InputPanel({ inputs, onInputChange, mode }: InputPanelProps) {
  const { t } = useTranslation()
  const isAdvanced = mode === 'advanced'

  const field = (name: keyof Inputs, extra: Omit<InputFieldProps, 'label' | 'name' | 'value' | 'onChange'> = {}) => (
    <InputField
      key={name}
      label={t(`inputs.${name}`)}
      name={name}
      value={inputs[name]}
      onChange={onInputChange}
      tooltip={t(`tooltips.${name}`, { defaultValue: '' }) || undefined}
      {...extra}
    />
  )

  return (
    <div className="input-panel">
      <Section id="rent" title={t('sections.rent')} icon={Home} iconColor={COLORS.rent} stripe="rent">
        <div className="input-grid">
          {field('monthlyRent',   { unit: 'kr / mnd', min: 0, step: 500 })}
          {field('rentIncrease', { unit: '%', min: 0, max: 20, step: 0.1 })}
          {isAdvanced && <>
            {field('contentsInsurance', { unit: 'kr / år',  min: 0, step: 100 })}
            {field('electricity',       { unit: 'kr / år',  min: 0, step: 500 })}
            {field('internet',          { unit: 'kr / år',  min: 0, step: 100 })}
            {field('parking',           { unit: 'kr / mnd', min: 0, step: 100 })}
          </>}
        </div>
      </Section>

      <Section id="buy" title={t('sections.buy')} icon={House} iconColor={COLORS.buy} stripe="buy">
        <div className="input-grid">
          {field('purchasePrice',   { unit: 'kr',         min: 0,   step: 100000 })}
          {field('downPayment',     { unit: 'kr',         min: 0,   step: 50000  })}
          {field('mortgageRate',    { unit: '%',          min: 0.1, max: 15, step: 0.1 })}
          {field('loanTermYears',   { unit: t('units.years'), min: 1, max: 30, step: 1 })}
          {field('monthlyHoaFee',   { unit: 'kr / mnd',   min: 0,   step: 100   })}
          {field('stampDuty',       { unit: 'kr',         min: 0,   step: 10000 })}
          {field('brokerSellingFee',{ unit: 'kr',         min: 0,   step: 10000 })}
          {isAdvanced && <>
            {field('otherClosingCosts',  { unit: 'kr',       min: 0, step: 1000  })}
            {field('sharedDebt',         { unit: 'kr',       min: 0, step: 10000 })}
            {field('sharedDebtRate',     { unit: '%',        min: 0, max: 15, step: 0.1 })}
            {field('interestOnlyYears',  { unit: t('units.years'), min: 0, max: 10, step: 1 })}
            {field('municipalFees',      { unit: 'kr / år',  min: 0, step: 500   })}
            {field('renovationPct',      { unit: '%',        min: 0, max: 5, step: 0.1 })}
            {field('homeInsurance',      { unit: 'kr / år',  min: 0, step: 500   })}
            {field('propertyTax',        { unit: 'kr / år',  min: 0, step: 500   })}
            {field('hoaFeeIncrease',     { unit: '%',        min: 0, max: 10, step: 0.1 })}
          </>}
        </div>
      </Section>

      <Section id="time" title={t('sections.timeMarket')} icon={TrendingUp} iconColor={COLORS.time} stripe="time">
        <div className="input-grid">
          {field('years',            { unit: t('units.years'), min: 1, max: 30, step: 1 })}
          {field('appreciationRate', { unit: '%', min: 0, max: 15, step: 0.1 })}
          {field('inflation',        { unit: '%', min: 0, max: 10, step: 0.1 })}
          {!isAdvanced && field('investmentReturn', { unit: '%', min: 0, max: 20, step: 0.1 })}
        </div>
      </Section>

      {isAdvanced && (
        <Section id="fin" title={t('sections.financial')} icon={Wallet} iconColor={COLORS.financial} stripe="fin">
          <div className="input-grid">
            {field('savingsAccountBalance', { unit: 'kr', min: 0, step: 10000 })}
            {field('savingsAccountRate',    { unit: '%',  min: 0, max: 20, step: 0.1 })}
            {field('askBalance',            { unit: 'kr', min: 0, step: 10000 })}
            {field('askRate',               { unit: '%',  min: 0, max: 30, step: 0.1 })}
            {field('askShieldingRate',      { unit: '%',  min: 0, max: 10, step: 0.1 })}
            <CheckboxField
              label={t('inputs.bsuActive')}
              name="bsuActive"
              value={inputs.bsuActive}
              onChange={onInputChange}
              tooltip={t('tooltips.bsuActive', { defaultValue: '' }) || undefined}
            />
            {inputs.bsuActive === 1 && field('bsuYearlyContribution', { unit: 'kr / år', min: 0, max: BSU_MAX_CONTRIBUTION, step: 500 })}
          </div>
        </Section>
      )}
    </div>
  )
}
