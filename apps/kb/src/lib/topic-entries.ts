import { getCollection } from 'astro:content'

import { getTopicsWithEntries } from './topics'

// Visible topics with at least one guide or troubleshooting entry. Kept out of
// topics.ts because content.config.ts imports that file, and this one needs
// astro:content.
export async function getNavTopics() {
  const guides = await getCollection('guides')
  const troubleshooting = await getCollection('troubleshooting')
  return getTopicsWithEntries([...guides, ...troubleshooting].map((entry) => entry.data.topics))
}
