import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark, Trash2, Upload } from 'lucide-react'
import { calculate } from '../utils/calculations'
import { MAX_SAVED_SCENARIOS, type SavedScenario, type Scenario } from '../utils/scenarioStorage'
import { useFormatNOK } from '../hooks/useFormatNOK'
import type { CalculationResult } from '../types'

interface ScenarioCompareProps {
  current: Scenario
  currentResult: CalculationResult
  saved: SavedScenario[]
  onSave: (name: string) => void
  onLoad: (scenario: SavedScenario) => void
  onDelete: (id: string) => void
}

interface Row {
  key: string
  name: string
  scenario: Scenario
  result: CalculationResult
  saved?: SavedScenario
}

export default function ScenarioCompare({ current, currentResult, saved, onSave, onLoad, onDelete }: ScenarioCompareProps) {
  const { t } = useTranslation()
  const formatKr = useFormatNOK()
  const [name, setName] = useState('')
  const atLimit = saved.length >= MAX_SAVED_SCENARIOS

  const rows = useMemo<Row[]>(() => [
    { key: 'current', name: t('scenarios.current'), scenario: current, result: currentResult },
    ...saved.map(s => ({ key: s.id, name: s.name, scenario: s, result: calculate(s.inputs, s.mode), saved: s })),
  ], [t, current, currentResult, saved])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (atLimit) return
    onSave(name.trim() || t('scenarios.defaultName', { n: saved.length + 1 }))
    setName('')
  }

  return (
    <section className="scenarios" aria-labelledby="scenarios-title">
      <div className="scenarios-head">
        <div>
          <h3 id="scenarios-title" className="scenarios-title">{t('scenarios.title')}</h3>
          <p className="scenarios-subtitle">{t('scenarios.subtitle')}</p>
        </div>
        <form className="scenarios-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="scenarios-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('scenarios.namePlaceholder')}
            aria-label={t('scenarios.nameLabel')}
            maxLength={40}
            disabled={atLimit}
          />
          <button type="submit" className="secondary-btn" disabled={atLimit}>
            <Bookmark size={15} aria-hidden /> {t('scenarios.save')}
          </button>
        </form>
      </div>
      {atLimit && <p className="scenarios-hint">{t('scenarios.limit', { max: MAX_SAVED_SCENARIOS })}</p>}

      <div className="scenarios-table-wrap">
        <table className="scenarios-table">
          <thead>
            <tr>
              <th scope="col">{t('scenarios.colScenario')}</th>
              <th scope="col">{t('scenarios.colWinner')}</th>
              <th scope="col" className="num">{t('scenarios.colAdvantage')}</th>
              <th scope="col" className="num">{t('scenarios.colBreakeven')}</th>
              <th scope="col" className="num">{t('scenarios.colBuyMonthly')}</th>
              <th scope="col" className="num">{t('scenarios.colRentMonthly')}</th>
              <th scope="col"><span className="visually-hidden">{t('scenarios.colActions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className={row.saved ? undefined : 'current'}>
                <th scope="row">
                  <span className="scenarios-row-name">{row.name}</span>
                  <span className="scenarios-row-meta">
                    {t('scenarios.summary', { mode: t(`mode.${row.scenario.mode}`), years: row.scenario.inputs.years })}
                  </span>
                </th>
                <td>
                  <span className={`scenarios-pill ${row.result.recommendation}`}>
                    {t(`results.${row.result.recommendation}`)}
                  </span>
                </td>
                <td className="num">{formatKr(row.result.difference, true)}</td>
                <td className="num">
                  {row.result.breakevenYear !== null
                    ? t('scenarios.yearN', { year: row.result.breakevenYear })
                    : t('scenarios.none')}
                </td>
                <td className="num">{formatKr(row.result.summary.year1BuyerCosts.total)}</td>
                <td className="num">{formatKr(row.result.summary.year1RenterCosts.total)}</td>
                <td>
                  {row.saved && (
                    <div className="scenarios-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onLoad(row.saved!)}
                        aria-label={t('scenarios.loadLabel', { name: row.name })}
                        title={t('scenarios.load')}
                      >
                        <Upload size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onDelete(row.saved!.id)}
                        aria-label={t('scenarios.deleteLabel', { name: row.name })}
                        title={t('scenarios.delete')}
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saved.length === 0 && <p className="scenarios-hint">{t('scenarios.empty')}</p>}
    </section>
  )
}
