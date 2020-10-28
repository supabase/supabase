import {importJs, errorJs} from './common'

/**
 * patch.mdx examples
 */

export const patchRecordJs = `
const { data, error } = await supabase
  .from('cities')
  .update({ name: 'Middle Earth' })
  .match({ name: 'Auckland' })
`.trim()










