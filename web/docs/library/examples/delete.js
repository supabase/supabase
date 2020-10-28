import {importJs, errorJs} from './common'

/**
 * delete.mdx examples
 */

export const deleteRecordJs = `
const { data, error } = await supabase
  .from('cities')
  .delete()
  .match({ id: 666 })
`.trim()

export const deleteFilterJs = `
const { data, error } = await supabase
  .from('cities')
  .delete()
  .filter({'name', 'eq', 'Paris'})
`.trim()

export const deleteNotJs = `
const { data, error } = await supabase
  .from('cities')
  .delete()
  .not('name', 'eq', 'Paris')
`.trim()









export const deleteOvaJs = `
const { data, error } = await supabase
  .from('countries')
  .delete()
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const deleteOvrJs = `
const { data, error } = await supabase
  .from('countries')
  .delete()
  .ovr('population_range_millions', [150, 250])
`.trim()





