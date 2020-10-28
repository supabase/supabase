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




export const getSingleJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .single()
`.trim()



export const getOrJs = `
const { data, error } = await supabase
  .from('cities')
  .select('name, country_id')
  .or('id.gt.20,and(name.eq.New Zealand,name.eq.France)')
`.trim()







export const getJsonData = `
const { data, error } = await supabase
  .from('countries')
  .select(\`
    json_column_name->>population,
    json_column_name->weather->>temperature
  \`)
`.trim()
