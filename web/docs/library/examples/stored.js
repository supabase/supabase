import {importJs, errorJs} from './common'

/**
 * stored-procedures.mdx examples
 */

export const storedSingleJs = `
const { error, data } = await supabase
  .rpc('echo_city', { name: 'The Shire' })
}
`.trim()

export const storedBulkJs = `
const { error, data } = await supabase
  .rpc('echo_city', [
    { name: 'The Shire' },
    { name: 'Mordor' }
  ])
}
`.trim()

export const storedReadingJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
`.trim()

export const storedFilterJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .filter({'name', 'eq', 'Paris'})
`.trim()

export const storedNotJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities)
  .not('name', 'eq', 'Paris')
`.trim()

export const storedMatchJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .match({name: 'Beijing', country_id: 156})
`.trim()

export const storedEqJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .eq('name', 'San Francisco')
`.trim()

export const storedNeqJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .neq('name', 'Lagos')
`.trim()

export const storedGtJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .gt('country_id', 250)
`.trim()

export const storedLtJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .lt('country_id', 250)
`.trim()

export const storedGteJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .gte('country_id', 250)
`.trim()

export const storedLteJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .lte('country_id', 250)
`.trim()

export const storedLikeJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .like('name', '%la%')
`.trim()

export const storedIlikeJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .ilike('name', '%la%')
`.trim()

export const storedIsJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .is('name', null)
`.trim()

export const storedInJs = `
const { error, data } = await supabase
  .rpc('echo_all_cities')
  .in('name', ['Rio de Janeiro', 'San Francisco'])
`.trim()

export const storedCsJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .cs('main_exports', ['oil'])
`.trim()

export const storedCdJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .cd('main_exports', ['cars', 'food', 'machine'])
`.trim()

export const storedOvaJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const storedOvrJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .ovr('population_range_millions', [150, 250])
`.trim()

export const storedSlJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .sl('population_range_millions', [150, 250])
`.trim()

export const storedSrJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .sr('population_range_millions', [150, 250])
`.trim()

export const storedNxlJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .nxl('population_range_millions', [150, 250])
`.trim()

export const storedNxrJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .nxr('population_range_millions', [150, 250])
`.trim()

export const storedAdjJs = `
const { error, data } = await supabase
  .rpc('echo_all_countries')
  .adj('population_range_millions', [70, 185])
`.trim()
