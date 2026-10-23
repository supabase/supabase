import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const storageGetStarted: ContentListingGroup = {
  id: 'storage-get-started',
  heading: 'Get started',
  description: 'Choose the bucket type that fits your use case:',
  type: 'grid',
  items: [
    {
      title: 'Files buckets',
      href: '/guides/storage/quickstart',
      description:
        'Store and serve images, videos, documents, and general-purpose files with direct URL access and row-level security.',
    },
    {
      title: 'Analytics buckets',
      href: '/guides/storage/analytics/introduction',
      description:
        'Store data in Apache Iceberg tables for data lakes, logs, and Supabase Pipelines. Query from Postgres via foreign tables with partitioning.',
    },
    {
      title: 'Vector buckets',
      href: '/guides/storage/vector/introduction',
      description:
        'Store embeddings and run similarity search for semantic matching, AI, and RAG. Use HNSW indexing, distance metrics, and metadata filtering.',
    },
  ],
}

export const storageExamples: ContentListingGroup = {
  id: 'storage-examples',
  heading: 'Examples',
  description: 'Working sample projects for common Storage integration patterns:',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Storage templates and examples',
      href: 'https://github.com/supabase/supabase/tree/master/examples/storage',
      description:
        'Sample projects for resumable uploads, signed upload URLs, and serving map tiles from private buckets.',
    },
    {
      title: 'Resumable Uploads with Uppy',
      href: 'https://github.com/supabase/supabase/tree/master/examples/storage/resumable-upload-uppy',
      icon: '/docs/img/icons/github-icon',
      description:
        'Upload large files with pause-and-resume support using Uppy and the TUS protocol.',
    },
  ],
}

export const storageResources: ContentListingGroup = {
  id: 'storage-resources',
  heading: 'Resources',
  description: 'Source code and REST API reference for the Storage service:',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Supabase Storage API',
      href: 'https://github.com/supabase/storage-api',
      description: 'Amazon S3-compatible object storage service that stores metadata in Postgres.',
    },
    {
      title: 'OpenAPI Spec',
      href: 'https://supabase.github.io/storage/',
      description:
        'Interactive reference for Storage REST endpoints, request parameters, and response schemas.',
    },
  ],
}
