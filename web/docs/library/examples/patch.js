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
      .update({ name: 'Middle Earth' })
      .match({ name: 'New Zealand' })

    return updates
  } catch (error) {
    console.log('Error: ', error)
  }
}
`