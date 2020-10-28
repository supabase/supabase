import {importJs, errorJs} from './common'

/**
 * stored-procedures.mdx examples
 */

export const storedSingleJs = `
const { data, error } = await supabase
  .rpc('echo_city', { name: 'The Shire' })
}
`.trim()

export const storedBulkJs = `
const { data, error } = await supabase
  .rpc('echo_city', [
    { name: 'The Shire' },
    { name: 'Mordor' }
  ])
}
`.trim()

export const storedReadingJs = `
const { data, error } = await supabase
  .rpc('echo_all_cities')
`.trim()

export const storedFilterJs = `
const { data, error } = await supabase
  .rpc('echo_all_cities')
  .filter({'name', 'eq', 'Paris'})
`.trim()

export const storedNotJs = `
const { data, error } = await supabase
  .rpc('echo_all_cities)
  .not('name', 'eq', 'Paris')
`.trim()















export const storedOvaJs = `
const { data, error } = await supabase
  .rpc('echo_all_countries')
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const storedOvrJs = `
const { data, error } = await supabase
  .rpc('echo_all_countries')
  .ovr('population_range_millions', [150, 250])
`.trim()




