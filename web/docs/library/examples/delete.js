import {importJs, errorJs} from './common'

/**
 * delete.mdx examples
 */

export const deleteRecordJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .match({ id: 666 })
`.trim()

export const deleteFilterJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .filter({'name', 'eq', 'Paris'})
`.trim()

export const deleteNotJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .not('name', 'eq', 'Paris')
`.trim()

export const deleteMatchJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .match({name: 'Beijing', country_id: 156})
`.trim()

export const deleteEqJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .eq('name', 'San Francisco')
`.trim()

export const deleteNeqJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .neq('name', 'Lagos')
`.trim()

export const deleteGtJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .gt('country_id', 250)
`.trim()

export const deleteLtJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .lt('country_id', 250)
`.trim()

export const deleteGteJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .gte('country_id', 250)
`.trim()

export const deleteLteJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .lte('country_id', 250)
`.trim()

export const deleteLikeJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .like('name', '%la%')
`.trim()

export const deleteIlikeJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .ilike('name', '%la%')
`.trim()

export const deleteIsJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .is('name', null)
`.trim()

export const deleteInJs = `
const { error, data } = await supabase
  .from('cities')
  .delete()
  .in('name', ['Rio de Janeiro', 'San Francisco'])
`.trim()

export const deleteCsJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .cs('main_exports', ['oil'])
`.trim()

export const deleteCdJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .cd('main_exports', ['cars', 'food', 'machine'])
`.trim()

export const deleteOvaJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const deleteOvrJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .ovr('population_range_millions', [150, 250])
`.trim()

export const deleteSlJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .sl('population_range_millions', [150, 250])
`.trim()

export const deleteSrJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .sr('population_range_millions', [150, 250])
`.trim()

export const deleteNxlJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .nxl('population_range_millions', [150, 250])
`.trim()

export const deleteNxrJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .nxr('population_range_millions', [150, 250])
`.trim()

export const deleteAdjJs = `
const { error, data } = await supabase
  .from('countries')
  .delete()
  .adj('population_range_millions', [70, 185])
`.trim()
