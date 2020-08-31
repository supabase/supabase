/**
 * post.mdx examples
 */

export const postSingleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const createCities = async () => {
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
`.trim()

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
`.trim()

export const postUpsertJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const createCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .insert(
        [
          { name: 'The Shire', country_id: 554 },
          { name: 'Rohan', country_id: 555 },
          { name: 'City by the Bay', country_id:840}
        ],
        { upsert: true })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()