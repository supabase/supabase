/**
 * post.mdx examples
 */

export const postSingleJs = `
const { data, error } = await supabase
  .from('cities')
  .insert([
    { name: 'The Shire', country_id: 554 }
  ])
`.trim()

export const postBulkJs = `
const { data, error } = await supabase
  .from('cities')
  .insert([
    { name: 'The Shire', country_id: 554 },
    { name: 'Rohan', country_id: 555 },
  ])
`.trim()

export const postUpsertJs = `
const { data, error } = await supabase
  .from('cities')
  .insert(
    [
      { name: 'The Shire', country_id: 554 },
      { name: 'Rohan', country_id: 555 },
      { name: 'City by the Bay', country_id:840}
    ],
    { upsert: true })
`.trim()