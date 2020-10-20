import {importJs, errorJs} from './common'

/**
 * patch.mdx examples
 */

export const patchRecordJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Middle Earth' })
  .match({ name: 'Auckland' })
`.trim()

export const patchFilterJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .filter('name', 'eq', 'Paris')
`.trim()

export const patchNotJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .not('name', 'eq', 'Paris')
`.trim()

export const patchMatchJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .match({name: 'Beijing', country_id: 156})
`.trim()

export const patchEqJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .eq('name', 'San Francisco')
`.trim()

export const patchNeqJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .neq('name', 'Lagos')
`.trim()

export const patchGtJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .gt('country_id', 250)
`.trim()

export const patchLtJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .lt('country_id', 250)
`.trim()

export const patchGteJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .gte('country_id', 250)
`.trim()

export const patchLteJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .lte('country_id', 250)
`.trim()

export const patchLikeJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .like('name', '%la%')
}
`.trim()

export const patchIlikeJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .ilike('name', '%la%')
`.trim()

export const patchIsJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .is('name', null)
`.trim()

export const patchInJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Mordor' })
  .in('name', ['Rio de Janeiro', 'San Francisco'])
`.trim()

export const patchCsJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .cs('main_exports', ['oil'])
`.trim()

export const patchCdJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .cd('main_exports', ['orks', 'surveillance', 'evil'])
`.trim()

export const patchOvaJs = `
let countries = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const patchOvrJs = `
let countries = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .ovr('population_range_millions', [150, 250])
`.trim()

export const patchSlJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .sl('population_range_millions', [150, 250])
`.trim()

export const patchSrJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .sr('population_range_millions', [150, 250])
`.trim()

export const patchNxlJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .nxl('population_range_millions', [150, 250])
`.trim()

export const patchNxrJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .nxr('population_range_millions', [150, 250])
`.trim()

export const patchAdjJs = `
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Mordor' })
  .adj('population_range_millions', [70, 185])
`.trim()
