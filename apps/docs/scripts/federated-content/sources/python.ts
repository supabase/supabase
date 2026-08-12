import type { FederatedContentSource } from '../types'

// We fetch these docs at build time from an external repo
const python: FederatedContentSource = {
  section: 'ai/python',
  org: 'supabase',
  repo: 'vecs',
  branch: 'main',
  docsDir: 'docs',
  externalSite: 'https://supabase.github.io/vecs',
  pageMap: [
    {
      slug: 'api',
      meta: {
        title: 'API',
      },
      remoteFile: 'api.md',
    },
    {
      slug: 'collections',
      meta: {
        title: 'Collections',
      },
      remoteFile: 'concepts_collections.md',
    },
    {
      slug: 'indexes',
      meta: {
        title: 'Indexes',
      },
      remoteFile: 'concepts_indexes.md',
    },
    {
      slug: 'metadata',
      meta: {
        title: 'Metadata',
      },
      remoteFile: 'concepts_metadata.md',
    },
  ],
}

export default python
