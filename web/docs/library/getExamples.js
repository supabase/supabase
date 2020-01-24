
export const getSimpleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const getColumnsJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const getForeignJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select(\`
        name,
        cities (
          name
        )
      \`)
    return countries
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const getForeignMultipleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://shop.supabase.co', 'public-key-bOYapLADERfE')

const getProducts = async () => {
  try {
    let products = await supabase
      .from('products')
      .select(\`
        id,
        supplier:supplier_id ( name ),
        purchaser:purchaser_id ( name )
      \`)
    return products
  } catch (error) {
    console.log('Error: ', error)
  }
}
`