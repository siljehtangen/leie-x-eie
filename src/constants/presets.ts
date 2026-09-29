import type { Inputs } from '../types'

export type PresetValues = Pick<Inputs, 'purchasePrice' | 'monthlyRent' | 'monthlyHoaFee'>

export interface CityPreset {
  id: string
  name: string
  values: PresetValues
}

// Rough figures for a typical two-bedroom flat (~60 m²), meant as a starting point.
export const CITY_PRESETS: readonly CityPreset[] = [
  { id: 'oslo',      name: 'Oslo',      values: { purchasePrice: 5_500_000, monthlyRent: 17_500, monthlyHoaFee: 3_500 } },
  { id: 'bergen',    name: 'Bergen',    values: { purchasePrice: 4_200_000, monthlyRent: 14_000, monthlyHoaFee: 3_200 } },
  { id: 'trondheim', name: 'Trondheim', values: { purchasePrice: 4_300_000, monthlyRent: 13_500, monthlyHoaFee: 3_000 } },
  { id: 'stavanger', name: 'Stavanger', values: { purchasePrice: 3_900_000, monthlyRent: 13_500, monthlyHoaFee: 3_000 } },
  { id: 'tromso',    name: 'Tromsø',    values: { purchasePrice: 3_800_000, monthlyRent: 13_000, monthlyHoaFee: 3_000 } },
]
