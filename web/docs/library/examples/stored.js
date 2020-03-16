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
            .rpc('echo_all_cities')
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`
export const storedFilterJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .filter({'name', 'eq', 'Paris'})
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedMatchJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .match({name: 'Beijing', country_id: 156})
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedEqJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .eq('name', 'San Francisco')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedGtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .gt('country_id', 250)
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedLtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .lt('country_id', 250)
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedGteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .gte('country_id', 250)
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedLteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .lte('country_id', 250)
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedLikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .like('name', '%la%')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedIlikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .ilike('name', '%la%')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedIsJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .is('name', null)
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedInJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const storedNotJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .not('name', 'Lagos')
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`
