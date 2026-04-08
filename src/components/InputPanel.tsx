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
import type { Inputs, Mode } from '../types'

function formatNum(v: number): string {
  const parts = v.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return parts.join('.')
}

// ── Input Field ────────────────────────────────────────────────────────────────
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
        <button className="input-stepper-btn" onClick={decrement} tabIndex={-1} type="button">−</button>
        <input
          type="text"
          inputMode="decimal"
          value={focused ? value : formatNum(value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => {
            const raw = e.target.value.replace(/[\s\u202f]/g, '').replace(',', '.')
            const v = raw === '' ? 0 : parseFloat(raw)
            onChange(name, isNaN(v) ? 0 : v)
          }}
        />
        {unit && <span className="input-unit">{unit}</span>}
        <button className="input-stepper-btn" onClick={increment} tabIndex={-1} type="button">+</button>
      </div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────
interface SectionProps {
  id: string
  title: string
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  iconColor: string
  stripe: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ id, title, icon: Icon, iconColor, stripe, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="input-section">
      <div className={`section-stripe stripe-${stripe}`} />
      <div className="section-header" onClick={() => setOpen(o => !o)}>
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
      {open && <div className="section-body">{children}</div>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
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
      {/* ── Rent ──────────────────────────────────────────────────────────────── */}
      <Section id="rent" title={t('sections.rent')} icon={Home} iconColor="#C4522E" stripe="rent">
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

      {/* ── Buy ───────────────────────────────────────────────────────────────── */}
      <Section id="buy" title={t('sections.buy')} icon={House} iconColor="#2952A3" stripe="buy">
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

      {/* ── Time & Market ─────────────────────────────────────────────────────── */}
      <Section id="time" title={t('sections.timeMarket')} icon={TrendingUp} iconColor="#1F7A5E" stripe="time">
        <div className="input-grid">
          {field('years',            { unit: t('units.years'), min: 1, max: 30, step: 1 })}
          {field('appreciationRate', { unit: '%', min: 0, max: 15, step: 0.1 })}
          {field('investmentReturn', { unit: '%', min: 0, max: 20, step: 0.1 })}
        </div>
      </Section>

      {/* ── Financial ────────────────────────────────────────────────────────── */}
      {isAdvanced && (
        <Section id="fin" title={t('sections.financial')} icon={Wallet} iconColor="#6B3FA0" stripe="fin">
          <div className="input-grid">
            {field('interestDeduction', { unit: '%',  min: 0,   max: 50,  step: 0.5 })}
            {field('investmentTaxRate', { unit: '%',  min: 0,   max: 60,  step: 0.5 })}
            {field('wealthTaxRate',     { unit: '%',  min: 0,   max: 2,   step: 0.1 })}
            {field('inflation',         { unit: '%',  min: 0,   max: 10,  step: 0.1 })}
          </div>
        </Section>
      )}
    </div>
  )
}
