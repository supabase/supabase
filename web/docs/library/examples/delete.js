import {importJs, errorJs} from './common'

/**
 * delete.mdx examples
 */

export const deleteRecordJs = `
const { data, error } = await supabase
  .from('cities')
  .delete()
  .match({ id: 666 })
`.trim()








