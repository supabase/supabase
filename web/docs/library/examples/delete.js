/**
 * delete.mdx examples
 */

export const deleteRecordJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const deleteCity = async () => {
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

export const deleteFilterJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .filter({'name', 'eq', 'Paris'})
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteMatchJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .match({name: 'Beijing', country_id: 156})
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteEqJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .eq('name', 'San Francisco')
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteGtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gt('country_id', 250)
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteLtJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lt('country_id', 250)
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteGteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gte('country_id', 250)
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteLteJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lte('country_id', 250)
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteLikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .like('name', '%la%')
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteIlikeJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .ilike('name', '%la%')
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteIsJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .is('name', null)
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteInJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`

export const deleteNotJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')

const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .not('name', 'Lagos')
      .delete()
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`
