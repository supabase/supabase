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








