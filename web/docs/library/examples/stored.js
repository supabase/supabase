import {importJs, errorJs} from './common'

/**
 * stored-procedures.mdx examples
 */

export const storedSingleJs = `
const { data, error } = await supabase
  .rpc('echo_city', { name: 'The Shire' })
}
`.trim()

export const storedBulkJs = `
const { data, error } = await supabase
  .rpc('echo_city', [
    { name: 'The Shire' },
    { name: 'Mordor' }
  ])
}
`.trim()

export const storedReadingJs = `
const { data, error } = await supabase
  .rpc('echo_all_cities')
`.trim()











