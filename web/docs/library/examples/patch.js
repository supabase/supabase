/**
 * patch.mdx examples
 */

export const patchRecordJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const updateCityName = async () => {
  try {
    let updates = await supabase
      .from('cities')
      .update({ name: 'Middle Earth' })
      .match({ name: 'Auckland' })

    return updates
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchFilterJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .filter({'name', 'eq', 'Paris'})
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchMatchJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .match({name: 'Beijing', country_id: 156})
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchEqJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .eq('name', 'San Francisco')
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchGtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gt('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchLtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lt('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchGteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gte('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchLteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lte('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchLikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .like('name', '%la%')
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchIlikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .ilike('name', '%la%')
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchIsJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .is('name', null)
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchInJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const patchNotJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .not('name', 'Lagos')
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`