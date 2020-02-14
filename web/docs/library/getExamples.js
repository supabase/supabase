/**
 * subscribe.mdx examples
 */

export const subscribeAllJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('*')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`

export const subscribeTableJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`

export const subscribeInsertsJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('INSERT', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`

export const subscribeUpdatesJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('UPDATE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`

export const subscribeDeletesJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('DELETE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()
`

export const subscribeMultipleJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('INSERT', handleRecordInserted)
  .on('DELETE', handleRecordDeleted)
  .subscribe()
`

export const subscribeUnsubscribeJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Unsubscribe from changes
mySubscription.unsubscribe()
`

export const subscribeRemoveJs = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

// Listen to changes
const mySubscription = supabase
  .from('countries')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Disconnect mySubscription
supabase.removeSubscription(mySubscription)
`

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

/**
 * post.mdx examples
 */

export const postSingleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .insert([
        { name: 'The Shire', country_id: 554 }
      ])
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const postBulkJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const createCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .insert([
        { name: 'The Shire', country_id: 554 },
        { name: 'Rohan', country_id: 555 },
      ])
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

/**
 * patch.mdx examples
 */

export const patchRecordJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const updateCountryName = async () => {
  try {
    let updates = await supabase
      .from('countries')
      .udpate({ name: 'Middle Earth' })
      .match({ name: 'New Zealand' })

    return updates
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

/**
 * delete.mdx examples
 */

export const deleteRecordJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const updateCountryName = async () => {
  try {
    let values = await supabase
      .from('cities')
      .match({ id: 666 })
      .delete()

    return values
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

/**
 * stored-procedures.mdx examples
 */

export const storedSingleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const echoCity = async () => {
    try{
        let city = await supabase
            .rpc('echo_city', { name: 'The Shire' })
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`

export const storedBulkJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const echoCities = async () => {
    try{
        let cities = await supabase
            .rpc('echo_city', [
                { name: 'The Shire' },
                { name: 'Mordor' }
            ])
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`

export const storedReadingJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const echoCities = async () => {
    try{
        let cities = await supabase
            .rpc('asian_pacific_countries')
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`
