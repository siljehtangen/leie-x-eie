import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Home,
  House,
  TrendingUp,
  Wallet,
  ChevronDown,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { formatInputNum } from '../utils/formatting'
import { COLORS } from '../constants/theme'
import { BSU_MAX_CONTRIBUTION, MAX_HORIZON_YEARS, MAX_LOAN_TERM_YEARS, MIN_DOWN_PAYMENT_RATE } from '../constants/finance'
import type { Inputs, Mode, NumericInputKey, BooleanInputKey } from '../types'

interface InputFieldProps {
  label: string
  name: NumericInputKey
  value: number
  onChange: (name: NumericInputKey, value: number) => void
  unit?: string
  tooltip?: string
  min?: number
  max?: number
  step?: number
  warning?: string
}

function clamp(value: number, min?: number, max?: number): number {
  let v = value
  if (min !== undefined) v = Math.max(v, min)
  if (max !== undefined) v = Math.min(v, max)
  return v
}

function InputField({ label, name, value, onChange, unit, tooltip, min, max, step, warning }: InputFieldProps) {
  const { t: tA11y } = useTranslation()
  const [focused, setFocused] = useState(false)
  const s = step ?? 1

  const increment = () => onChange(name, clamp(parseFloat((value + s).toFixed(10)), min, max))
  const decrement = () => onChange(name, clamp(parseFloat((value - s).toFixed(10)), min, max))

  return (
    <div className={`input-field${warning ? ' has-warning' : ''}`}>
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
          onBlur={() => {
            setFocused(false)
            const clamped = clamp(value, min, max)
            if (clamped !== value) onChange(name, clamped)
          }}
          onChange={e => {
            const raw = e.target.value.replace(/[\s\u202f]/g, '').replace(',', '.')
            const v = raw === '' ? 0 : parseFloat(raw)
            onChange(name, isNaN(v) ? 0 : v)
          }}
        />
        {unit && <span className="input-unit">{unit}</span>}
        <button className="input-stepper-btn" onClick={increment} tabIndex={-1} type="button" aria-label={tA11y('a11y.increaseField', { label })}>+</button>
      </div>
      {warning && <p className="input-warning" role="status">{warning}</p>}
    </div>
  )
}

interface SectionProps {
  id: string
  title: string
  icon: LucideIcon
  iconColor: string
  defaultOpen?: boolean
  children: ReactNode
}

function CheckboxField({ label, name, value, onChange, tooltip }: {
  label: string
  name: BooleanInputKey
  value: boolean
  onChange: (name: BooleanInputKey, value: boolean) => void
  tooltip?: string
}) {
  return (
    <div className="input-field">
      <label className="input-label checkbox-label">
        <input
          type="checkbox"
          checked={value}
          onChange={e => onChange(name, e.target.checked)}
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

function Section({ id, title, icon: Icon, iconColor, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = `section-body-${id}`
  return (
    <div className={`input-section${open ? ' open' : ''}`}>
      <button
        type="button"
        className="section-header"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(o => !o)}
      >
        <div className={`section-icon ${id}`}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </div>
        <span className="section-title">{title}</span>
        <ChevronDown size={16} strokeWidth={2} className={`section-chevron${open ? ' open' : ''}`} aria-hidden />
      </button>
      {open && <div id={bodyId} className="section-body" role="region" aria-label={title}>{children}</div>}
    </div>
  )
}

interface InputPanelProps {
  inputs: Inputs
  onInputChange: (name: keyof Inputs, value: number | boolean) => void
  mode: Mode
}

export default function InputPanel({ inputs, onInputChange, mode }: InputPanelProps) {
  const { t } = useTranslation()
  const isAdvanced = mode === 'advanced'
  const kr = t('units.kr')
  const krMonth = t('units.krPerMonth')
  const krYear = t('units.krPerYear')
  const years = t('units.years')

  const downPaymentWarning =
    inputs.downPayment > inputs.purchasePrice
      ? t('warnings.downPaymentTooHigh')
      : inputs.purchasePrice > 0 && inputs.downPayment < inputs.purchasePrice * MIN_DOWN_PAYMENT_RATE
        ? t('warnings.downPaymentTooLow', { pct: MIN_DOWN_PAYMENT_RATE * 100 })
        : undefined

  const field = (name: NumericInputKey, extra: Omit<InputFieldProps, 'label' | 'name' | 'value' | 'onChange'> = {}) => (
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
      <Section id="rent" title={t('sections.rent')} icon={Home} iconColor={COLORS.rent}>
        <div className="input-grid">
          {field('monthlyRent',   { unit: krMonth, min: 0, step: 500 })}
          {field('rentIncrease', { unit: '%', min: 0, max: 20, step: 0.1 })}
          {isAdvanced && <>
            {field('contentsInsurance', { unit: krYear,  min: 0, step: 100 })}
            {field('electricity',       { unit: krYear,  min: 0, step: 500 })}
            {field('internet',          { unit: krYear,  min: 0, step: 100 })}
            {field('parking',           { unit: krMonth, min: 0, step: 100 })}
          </>}
        </div>
      </Section>

      <Section id="buy" title={t('sections.buy')} icon={House} iconColor={COLORS.buy}>
        <div className="input-grid">
          {field('purchasePrice',   { unit: kr,      min: 0,   step: 100000 })}
          {field('downPayment',     { unit: kr,      min: 0,   step: 50000, warning: downPaymentWarning })}
          {field('mortgageRate',    { unit: '%',     min: 0.1, max: 15, step: 0.1 })}
          {field('loanTermYears',   { unit: years,   min: 1,   max: MAX_LOAN_TERM_YEARS, step: 1 })}
          {field('monthlyHoaFee',   { unit: krMonth, min: 0,   step: 100   })}
          {field('stampDuty',       { unit: kr,      min: 0,   step: 10000 })}
          {field('brokerSellingFee',{ unit: kr,      min: 0,   step: 10000 })}
          {isAdvanced && <>
            {field('otherClosingCosts',  { unit: kr,     min: 0, step: 1000  })}
            {field('sharedDebt',         { unit: kr,     min: 0, step: 10000 })}
            {field('sharedDebtRate',     { unit: '%',    min: 0, max: 15, step: 0.1 })}
            {field('interestOnlyYears',  { unit: years,  min: 0, max: 10, step: 1 })}
            {field('municipalFees',      { unit: krYear, min: 0, step: 500   })}
            {field('renovationPct',      { unit: '%',    min: 0, max: 5, step: 0.1 })}
            {field('homeInsurance',      { unit: krYear, min: 0, step: 500   })}
            {field('propertyTax',        { unit: krYear, min: 0, step: 500   })}
            {field('hoaFeeIncrease',     { unit: '%',    min: 0, max: 10, step: 0.1 })}
          </>}
        </div>
      </Section>

      <Section id="time" title={t('sections.timeMarket')} icon={TrendingUp} iconColor={COLORS.time}>
        <div className="input-grid">
          {field('years',            { unit: years, min: 1, max: MAX_HORIZON_YEARS, step: 1 })}
          {field('appreciationRate', { unit: '%', min: 0, max: 15, step: 0.1 })}
          {field('inflation',        { unit: '%', min: 0, max: 10, step: 0.1 })}
          {!isAdvanced && field('investmentReturn', { unit: '%', min: 0, max: 20, step: 0.1 })}
        </div>
      </Section>

      {isAdvanced && (
        <Section id="fin" title={t('sections.financial')} icon={Wallet} iconColor={COLORS.financial}>
          <div className="input-grid">
            {field('savingsAccountBalance', { unit: kr, min: 0, step: 10000 })}
            {field('savingsAccountRate',    { unit: '%', min: 0, max: 20, step: 0.1 })}
            {field('askBalance',            { unit: kr, min: 0, step: 10000 })}
            {field('askRate',               { unit: '%', min: 0, max: 30, step: 0.1 })}
            {field('askShieldingRate',      { unit: '%', min: 0, max: 10, step: 0.1 })}
            <CheckboxField
              label={t('inputs.bsuActive')}
              name="bsuActive"
              value={inputs.bsuActive}
              onChange={onInputChange}
              tooltip={t('tooltips.bsuActive', { defaultValue: '' }) || undefined}
            />
            {inputs.bsuActive && field('bsuYearlyContribution', { unit: krYear, min: 0, max: BSU_MAX_CONTRIBUTION, step: 500 })}
          </div>
        </Section>
      )}
    </div>
  )
}
