import {importJs, errorJs} from './common'

/**
 * get.mdx examples
 */

export const getSimpleJs = `
const { error, data } = await supabase
    .from('cities')
    .select()
`.trim()

export const getColumnsJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name')
`.trim()

export const getForeignJs = `
const { error, data } = await supabase
  .from('countries')
  .select(\`
    name,
    cities (
      name
    )
  \`)
`.trim()

export const getForeignMultipleJs = `
const { error, data } = await supabase
  .from('products')
  .select(\`
    id,
    supplier:supplier_id ( name ),
    purchaser:purchaser_id ( name )
  \`)
`.trim()

export const getOrderJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name', 'country_id')
  .order('id')
`.trim()

export const getEmbeddedOrderJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, cities(name)')
  .eq('name', 'United States')
  .order('cities.name')
`.trim()

export const getLimitJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .limit(1)
`.trim()

export const getEmbeddedLimitJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, cities(name)')
  .eq('name', 'United States')
  .limit(1, 'cities')
`.trim()

export const getOffsetJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .offset(1)
`.trim()

export const getEmbeddedOffsetJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, cities(name)')
  .eq('name', 'United States')
  .offset(1, 'cities')
`.trim()

export const getRangeJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .range(0,3)
`.trim()

export const getSingleJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .single()
`.trim()

export const getFilterJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .filter('name', 'eq', 'Paris')
`.trim()

export const getFilterJsEmbedded = `
const { error, data } = await supabase
  .from('cities')
  .select('name, countries ( name )')
  .filter('countries.name', 'eq', 'France')
`.trim()

export const getNotJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .not('name', 'eq', 'Paris')
`.trim()

export const getOrJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .or('id.gt.20,and(name.eq.New Zealand,name.eq.France)')
`.trim()

export const getMatchJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .match({name: 'Beijing', country_id: 156})
`.trim()

export const getEqJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .eq('name', 'San Francisco')
`.trim()

export const getNeqJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .neq('name', 'Lagos')
`.trim()

export const getGtJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .gt('country_id', 250)
`.trim()

export const getLtJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .lt('country_id', 250)
`.trim()

export const getGteJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .gte('country_id', 250)
`.trim()

export const getLteJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .lte('country_id', 250)
`.trim()

export const getLikeJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .like('name', '%la%')
`.trim()

export const getIlikeJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .ilike('name', '%la%')
`.trim()

export const getIsJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .is('name', null)
`.trim()

export const getInJs = `
const { error, data } = await supabase
  .from('cities')
  .select('name, country_id')
  .in('name', ['Rio de Janeiro', 'San Francisco'])
`.trim()

export const getCsJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, main_exports')
  .cs('main_exports', ['oil'])
`.trim()

export const getCdJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, main_exports')
  .cd('main_exports', ['cars', 'food', 'machine'])
`.trim()

export const getOvaJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, main_exports')
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const getOvrJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .ovr('population_range_millions', [150, 250])
`.trim()

export const getSlJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .sl('population_range_millions', [150, 250])
`.trim()

export const getSrJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .sr('population_range_millions', [150, 250])
`.trim()

export const getNxlJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .nxl('population_range_millions', [150, 250])
`.trim()

export const getNxrJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .nxr('population_range_millions', [150, 250])
`.trim()

export const getAdjJs = `
const { error, data } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .adj('population_range_millions', [70, 185])
`.trim()

export const getJsonData = `
const { error, data } = await supabase
  .from('countries')
  .select(\`
    json_column_name->>population,
    json_column_name->weather->>temperature
  \`)
`.trim()
