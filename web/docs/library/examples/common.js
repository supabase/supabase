/**
 * Common snippets shared across all examples
 */

export const importJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', 'public-key-bOYapLADERfE')
`

export const errorJs = `
  } catch (error) {
      console.log('Error: ', error)
  }
}
`.trim()
