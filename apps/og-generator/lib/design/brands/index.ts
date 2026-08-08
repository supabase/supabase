import { multigres } from './multigres'
import { oriole } from './oriole'
import { supabase } from './supabase'
import { supasquad } from './supasquad'
import type { Brand, BrandId, ColorToken } from './types'

export type { Brand, BrandId, ColorToken } from './types'

export const BRANDS: Record<BrandId, Brand> = { supabase, multigres, oriole, supasquad }
export const DEFAULT_BRAND_ID: BrandId = 'supabase'

export const BRAND_OPTIONS: { id: BrandId; label: string }[] = Object.values(BRANDS).map((b) => ({
  id: b.id,
  label: b.name,
}))

/** Resolve a brand id (e.g. from a query param) to a Brand, defaulting to Supabase. */
export function getBrand(id: string | null | undefined): Brand {
  if (id && id in BRANDS) return BRANDS[id as BrandId]
  return BRANDS[DEFAULT_BRAND_ID]
}

/** Resolve a named color token to its hex value for the given brand. */
export function color(token: ColorToken, brand: Brand): string {
  return brand.colorPalette[token]
}
