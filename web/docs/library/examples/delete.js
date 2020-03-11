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