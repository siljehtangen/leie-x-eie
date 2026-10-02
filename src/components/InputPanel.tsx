import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
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
import { formatInputDraft, formatInputNum, formatPct, parseInputNum } from '../utils/formatting'
import { computeAffordability } from '../utils/affordability'
import { stampDutyForMode } from '../utils/calculations'
import { useLocale } from '../hooks/useLocale'
import { DEFAULT_INPUTS } from '../constants/defaults'
import {
  BSU_MAX_CONTRIBUTION, MAX_DEBT_TO_INCOME, MAX_HORIZON_YEARS, MAX_LOAN_TERM_YEARS, MIN_DOWN_PAYMENT_RATE,
} from '../constants/finance'
import type { Inputs, Mode, NumericInputKey, BooleanInputKey } from '../types'

function clamp(value: number, min?: number, max?: number): number {
  let v = value
  if (min !== undefined) v = Math.max(v, min)
  if (max !== undefined) v = Math.min(v, max)
  return v
}

function InfoTip({ text }: { text: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <span ref={ref} className={`tooltip-icon${open ? ' open' : ''}`}>
      <button
        type="button"
        className="tooltip-trigger"
        aria-label={t('a11y.moreInfo')}
        aria-describedby={id}
        aria-expanded={open}
        onClick={e => {
          e.preventDefault()
          setOpen(o => !o)
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false)
        }}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} aria-hidden />
      </button>
      <span id={id} role="tooltip" className="tooltip-popup">{text}</span>
    </span>
  )
}

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
  slider?: [number, number]
}

function InputField({ label, name, value, onChange, unit, tooltip, min, max, step, warning, slider }: InputFieldProps) {
  const { t: tA11y } = useTranslation()
  const locale = useLocale()
  const [draft, setDraft] = useState<string | null>(null)
  const s = step ?? 1
  const changed = value !== DEFAULT_INPUTS[name]

  const stepBy = (delta: number) => {
    const next = clamp(parseFloat((value + delta).toFixed(10)), min, max)
    onChange(name, next)
    if (draft !== null) setDraft(formatInputDraft(next, locale))
  }

  return (
    <div className={`input-field${warning ? ' has-warning' : ''}${changed ? ' changed' : ''}`}>
      <div className="input-label">
        {label}
        {tooltip && <InfoTip text={tooltip} />}
        {changed && <span className="changed-dot" title={tA11y('fieldState.changed')} aria-hidden />}
      </div>
      <div className="input-value-row">
        <button className="input-stepper-btn" onClick={() => stepBy(-s)} tabIndex={-1} type="button" aria-label={tA11y('a11y.decreaseField', { label })}>−</button>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-label={label}
          value={draft ?? formatInputNum(value, locale)}
          onFocus={() => setDraft(formatInputDraft(value, locale))}
          onBlur={() => {
            setDraft(null)
            const clamped = clamp(value, min, max)
            if (clamped !== value) onChange(name, clamped)
          }}
          onKeyDown={e => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
            e.preventDefault()
            const multiplier = e.shiftKey ? 10 : 1
            stepBy((e.key === 'ArrowUp' ? s : -s) * multiplier)
          }}
          onChange={e => {
            setDraft(e.target.value)
            onChange(name, parseInputNum(e.target.value))
          }}
        />
        {unit && <span className="input-unit">{unit}</span>}
        <button className="input-stepper-btn" onClick={() => stepBy(s)} tabIndex={-1} type="button" aria-label={tA11y('a11y.increaseField', { label })}>+</button>
      </div>
      {slider && (
        <input
          type="range"
          className="input-slider"
          min={slider[0]}
          max={slider[1]}
          step={s}
          value={clamp(value, slider[0], slider[1])}
          onChange={e => onChange(name, parseFloat(e.target.value))}
          tabIndex={-1}
          aria-hidden
        />
      )}
      {warning && <p className="input-warning" role="status">{warning}</p>}
    </div>
  )
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
      <div className="input-label checkbox-label">
        <label className="checkbox-control">
          <input
            type="checkbox"
            checked={value}
            onChange={e => onChange(name, e.target.checked)}
          />
          <span>{label}</span>
        </label>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
    </div>
  )
}

interface SectionProps {
  id: string
  title: string
  icon: LucideIcon
  defaultOpen?: boolean
  children: ReactNode
}

function Section({ id, title, icon: Icon, defaultOpen = true, children }: SectionProps) {
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
          <Icon size={18} strokeWidth={2} aria-hidden />
        </div>
        <span className="section-title">{title}</span>
        <ChevronDown size={16} strokeWidth={2} className={`section-chevron${open ? ' open' : ''}`} aria-hidden />
      </button>
      {open && <div id={bodyId} className="section-body" role="region" aria-label={title}>{children}</div>}
    </div>
  )
}

function MoreGroup({ id, title, changedCount, children }: {
  id: string
  title: string
  changedCount: number
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const bodyId = `more-${id}`
  return (
    <div className={`more-group${open ? ' open' : ''}`}>
      <button
        type="button"
        className="more-group-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        {changedCount > 0 && (
          <span className="more-group-badge">{t('fieldState.changedCount', { count: changedCount })}</span>
        )}
        <ChevronDown size={14} strokeWidth={2} className={`section-chevron small${open ? ' open' : ''}`} aria-hidden />
      </button>
      {open && <div id={bodyId} className="input-grid more-group-body">{children}</div>}
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
  const locale = useLocale()
  const isAdvanced = mode === 'advanced'
  const kr = t('units.kr')
  const krMonth = t('units.krPerMonth')
  const krYear = t('units.krPerYear')
  const years = t('units.years')

  const showSharedDebt = isAdvanced && inputs.isBorettslag
  const totalPriceForEquity = inputs.purchasePrice + (showSharedDebt ? inputs.sharedDebt : 0)
  const downPaymentWarning =
    inputs.downPayment > inputs.purchasePrice
      ? t('warnings.downPaymentTooHigh')
      : inputs.purchasePrice > 0 && inputs.downPayment < totalPriceForEquity * MIN_DOWN_PAYMENT_RATE
        ? t(showSharedDebt && inputs.sharedDebt > 0 ? 'warnings.downPaymentTooLowShared' : 'warnings.downPaymentTooLow', {
            pct: MIN_DOWN_PAYMENT_RATE * 100,
          })
        : undefined

  const affordability = computeAffordability(inputs, mode)
  const incomeWarning = affordability?.exceedsLimit
    ? t('warnings.debtToIncome', { value: formatPct(affordability.debtToIncome, locale, 1), max: MAX_DEBT_TO_INCOME })
    : undefined

  const changedCount = (keys: (keyof Inputs)[]) => keys.filter(k => inputs[k] !== DEFAULT_INPUTS[k]).length

  const checkbox = (name: BooleanInputKey) => (
    <CheckboxField
      key={name}
      label={t(`inputs.${name}`)}
      name={name}
      value={inputs[name]}
      onChange={onInputChange}
      tooltip={t(`tooltips.${name}`, { defaultValue: '' }) || undefined}
    />
  )

  const field = (
    name: NumericInputKey,
    extra: Omit<InputFieldProps, 'label' | 'name' | 'value' | 'onChange'> & { value?: number } = {},
  ) => {
    const { value, ...rest } = extra
    return (
      <InputField
        key={name}
        label={t(`inputs.${name}`)}
        name={name}
        value={value ?? inputs[name]}
        onChange={onInputChange}
        tooltip={t(`tooltips.${name}`, { defaultValue: '' }) || undefined}
        {...rest}
      />
    )
  }

  const rentExtras: NumericInputKey[] = ['contentsInsurance', 'electricity', 'internet', 'parking']
  const loanExtras: NumericInputKey[] = [
    ...(showSharedDebt ? ['sharedDebtRate', 'sharedDebtTermYears'] as const : []),
    'otherDebt', 'interestOnlyYears', 'mortgageRateChangeYear',
    ...(inputs.mortgageRateChangeYear > 0 ? ['mortgageRateAfterChange'] as const : []),
  ]
  const ownerExtras: NumericInputKey[] = [
    'otherClosingCosts', 'municipalFees', 'renovationPct', 'homeInsurance', 'propertyTax', 'hoaFeeIncrease',
    'rentalIncome',
  ]

  return (
    <div className="input-panel">
      <Section id="rent" title={t('sections.rent')} icon={Home}>
        <div className="input-grid">
          {field('monthlyRent',  { unit: krMonth, min: 0, step: 500 })}
          {field('rentIncrease', { unit: '%', min: 0, max: 20, step: 0.1, slider: [0, 8] })}
        </div>
        {isAdvanced && (
          <MoreGroup id="rent" title={t('groups.livingCosts')} changedCount={changedCount(rentExtras)}>
            {field('contentsInsurance', { unit: krYear,  min: 0, step: 100 })}
            {field('electricity',       { unit: krYear,  min: 0, step: 500 })}
            {field('internet',          { unit: krYear,  min: 0, step: 100 })}
            {field('parking',           { unit: krMonth, min: 0, step: 100 })}
          </MoreGroup>
        )}
      </Section>

      <Section id="buy" title={t('sections.buy')} icon={House}>
        <div className="input-grid">
          {isAdvanced && checkbox('isBorettslag')}
          {field('purchasePrice',   { unit: kr,      min: 0,   step: 100000 })}
          {field('downPayment',     { unit: kr,      min: 0,   step: 50000, warning: downPaymentWarning })}
          {showSharedDebt && field('sharedDebt', { unit: kr, min: 0, step: 10000 })}
          {field('householdIncome', { unit: krYear, min: 0, step: 50000, warning: incomeWarning })}
          {field('mortgageRate',    { unit: '%',     min: 0.1, max: 15, step: 0.1, slider: [1, 10] })}
          {field('loanTermYears',   { unit: years,   min: 1,   max: MAX_LOAN_TERM_YEARS, step: 1 })}
          {field('monthlyHoaFee',   { unit: krMonth, min: 0,   step: 100   })}
          {field('stampDuty', {
            unit: kr, min: 0, step: 10000,
            value: stampDutyForMode(inputs, mode),
          })}
          {field('brokerSellingFee',{ unit: kr,      min: 0,   step: 10000 })}
        </div>
        {isAdvanced && <>
          <MoreGroup id="loan" title={t('groups.loan')} changedCount={changedCount(loanExtras)}>
            {showSharedDebt && <>
              {field('sharedDebtRate',      { unit: '%',   min: 0, max: 15, step: 0.1 })}
              {field('sharedDebtTermYears', { unit: years, min: 0, max: 50, step: 1 })}
            </>}
            {field('otherDebt',          { unit: kr,     min: 0, step: 10000 })}
            {field('interestOnlyYears',  { unit: years,  min: 0, max: 10, step: 1 })}
            {field('mortgageRateChangeYear', { unit: years, min: 0, max: MAX_HORIZON_YEARS, step: 1 })}
            {inputs.mortgageRateChangeYear > 0 &&
              field('mortgageRateAfterChange', { unit: '%', min: 0, max: 15, step: 0.1 })}
          </MoreGroup>
          <MoreGroup id="owner" title={t('groups.ownerCosts')} changedCount={changedCount(ownerExtras)}>
            {field('otherClosingCosts',  { unit: kr,     min: 0, step: 1000  })}
            {field('municipalFees',      { unit: krYear, min: 0, step: 500   })}
            {field('renovationPct',      { unit: '%',    min: 0, max: 5, step: 0.1 })}
            {field('homeInsurance',      { unit: krYear, min: 0, step: 500   })}
            {field('propertyTax',        { unit: krYear, min: 0, step: 500   })}
            {field('hoaFeeIncrease',     { unit: '%',    min: 0, max: 10, step: 0.1 })}
            {field('rentalIncome',       { unit: krMonth, min: 0, step: 500 })}
          </MoreGroup>
        </>}
      </Section>

      <Section id="time" title={t('sections.timeMarket')} icon={TrendingUp}>
        <div className="input-grid">
          {field('years',            { unit: years, min: 1, max: MAX_HORIZON_YEARS, step: 1, slider: [1, MAX_HORIZON_YEARS] })}
          {field('appreciationRate', { unit: '%', min: -10, max: 15, step: 0.1, slider: [-5, 10] })}
          {field('inflation',        { unit: '%', min: 0, max: 10, step: 0.1, slider: [0, 6] })}
          {!isAdvanced && field('investmentReturn', { unit: '%', min: 0, max: 20, step: 0.1, slider: [0, 10] })}
        </div>
      </Section>

      {isAdvanced && (
        <Section id="fin" title={t('sections.financial')} icon={Wallet}>
          <div className="input-grid">
            {field('savingsAccountBalance', { unit: kr, min: 0, step: 10000 })}
            {field('savingsAccountRate',    { unit: '%', min: 0, max: 20, step: 0.1 })}
            {field('askBalance',            { unit: kr, min: 0, step: 10000 })}
            {field('askRate',               { unit: '%', min: 0, max: 30, step: 0.1, slider: [0, 12] })}
            {field('askShieldingRate',      { unit: '%', min: 0, max: 10, step: 0.1 })}
            {checkbox('isCouple')}
            {checkbox('bsuActive')}
            {inputs.bsuActive && field('bsuYearlyContribution', {
              unit: krYear, min: 0, max: BSU_MAX_CONTRIBUTION * (inputs.isCouple ? 2 : 1), step: 500,
            })}
          </div>
        </Section>
      )}
    </div>
  )
}
