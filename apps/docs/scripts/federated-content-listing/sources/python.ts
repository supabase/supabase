import type { FederatedContentListingSource } from '../types'

// We list these docs at build time from an external repo
export const python: FederatedContentListingSource = {
  org: 'supabase',
  repo: 'vecs',
  branch: 'main',
  docsDir: 'docs',
  externalSite: 'https://supabase.github.io/vecs',
  // index.md is covered by the guides/ai/python-clients page
  ignore: ['index.md', 'support_changelog.md'],
}
