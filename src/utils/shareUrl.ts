import { DEFAULT_INPUTS } from '../constants/defaults'
import { parseScenario, type Scenario } from './scenarioStorage'
import type { Inputs } from '../types'

const MODE_PARAM = 'mode'

export function encodeScenario(scenario: Scenario): string {
  const params = new URLSearchParams()
  params.set(MODE_PARAM, scenario.mode)
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]) {
    const value = scenario.inputs[key]
    if (value !== DEFAULT_INPUTS[key]) params.set(key, String(value))
  }
  return params.toString()
}

function scenarioParams(value: string): URLSearchParams {
  return new URLSearchParams(value.replace(/^[?#]/, ''))
}

export function decodeScenario(value: string): Scenario | null {
  const params = scenarioParams(value)
  if (!params.has(MODE_PARAM)) return null

  const inputs: Record<string, number | boolean> = {}
  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]) {
    const raw = params.get(key)
    if (raw === null) continue
    if (typeof DEFAULT_INPUTS[key] === 'boolean') {
      if (raw === 'true' || raw === 'false') inputs[key] = raw === 'true'
    } else if (raw.trim() !== '') {
      inputs[key] = Number(raw)
    }
  }
  return parseScenario({ mode: params.get(MODE_PARAM), inputs })
}

export function buildShareUrl(scenario: Scenario, location: Pick<Location, 'origin' | 'pathname'>): string {
  return `${location.origin}${location.pathname}#${encodeScenario(scenario)}`
}
