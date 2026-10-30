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
        description:
          'Reference for the vecs Python client, covering installation, connecting to Postgres, and creating and querying vector collections.',
      },
      remoteFile: 'api.md',
    },
    {
      slug: 'collections',
      meta: {
        title: 'Collections',
        description:
          'Explains vecs collections, the Postgres tables that store vector records with an ID, a vector, and JSON metadata.',
      },
      remoteFile: 'concepts_collections.md',
    },
    {
      slug: 'indexes',
      meta: {
        title: 'Indexes',
        description:
          'Explains how to create an index on a vecs collection to speed up vector queries, and the distance measures and index methods to choose from.',
      },
      remoteFile: 'concepts_indexes.md',
    },
    {
      slug: 'metadata',
      meta: {
        title: 'Metadata',
        description:
          'Describes the metadata types and query operators that vecs supports for filtering vector queries on metadata fields.',
      },
      remoteFile: 'concepts_metadata.md',
    },
  ],
}

export default python
