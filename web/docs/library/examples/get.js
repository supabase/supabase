/**
 * get.mdx examples
 */

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
`.trim()

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
`.trim()

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
`.trim()

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
`.trim()

export const getOrderJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .order('id')
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getRangeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .range(0,3)
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getSingleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .range(0)
      .single()
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getFilterJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .filter({'name', 'eq', 'Paris'})
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getMatchJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .match({name: 'Beijing', country_id: 156})
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getEqJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .eq('name', 'San Francisco')
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getGtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gt('country_id', 250)
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getLtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lt('country_id', 250)
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getGteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gte('country_id', 250)
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getLteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lte('country_id', 250)
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getLikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .like('name', '%la%')
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getIlikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .ilike('name', '%la%')
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getIsJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .is('name', null)
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getInJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const getNotJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .not('name', 'Lagos')
      .select('*')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()
