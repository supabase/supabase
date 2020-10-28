import {importJs, errorJs} from './common'

/**
 * get.mdx examples
 */

export const getSimpleJs = `
const { data, error } = await supabase
    .from('cities')
    .select()
`.trim()

export const getColumnsJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name')
`.trim()

export const getForeignJs = `
const { data, error } = await supabase
  .from('countries')
  .select(\`
    name,
    cities (
      name
    )
  \`)
`.trim()

export const getForeignMultipleJs = `
const { data, error } = await supabase
  .from('products')
  .select(\`
    id,
    supplier:supplier_id ( name ),
    purchaser:purchaser_id ( name )
  \`)
`.trim()

export const getOrderJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name', 'country_id')
  .order('id')
`.trim()

export const getEmbeddedOrderJs = `
const { data, error } = await supabase
  .from('countries')
  .select('name, cities(name)')
  .eq('name', 'United States')
  .order('cities.name')
`.trim()

export const getLimitJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .limit(1)
`.trim()

export const getEmbeddedLimitJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, cities(name)')
  .eq('name', 'United States')
  .limit(1, 'cities')
`.trim()

export const getOffsetJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .offset(1)
`.trim()

export const getEmbeddedOffsetJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, cities(name)')
  .eq('name', 'United States')
  .offset(1, 'cities')
`.trim()

export const getRangeJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .range(0,3)
`.trim()

export const getSingleJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .single()
`.trim()

export const getFilterJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .filter('name', 'eq', 'Paris')
`.trim()

export const getFilterJsEmbedded = `
const { data, error } = await supabase
  .from('cities')
  .select('name, countries ( name )')
  .filter('countries.name', 'eq', 'France')
`.trim()

export const getNotJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .not('name', 'eq', 'Paris')
`.trim()

export const getOrJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .or('id.gt.20,and(name.eq.New Zealand,name.eq.France)')
`.trim()










export const getOvaJs = `
const { data, error } = await supabase
  .from('countries')
  .select('name, id, main_exports')
  .ova('main_exports', ['computers', 'minerals'])
`.trim()

export const getOvrJs = `
const { data, error } = await supabase
  .from('countries')
  .select('name, id, population_range_millions')
  .ovr('population_range_millions', [150, 250])
`.trim()








export const getJsonData = `
const { data, error } = await supabase
  .from('countries')
  .select(\`
    json_column_name->>population,
    json_column_name->weather->>temperature
  \`)
`.trim()
