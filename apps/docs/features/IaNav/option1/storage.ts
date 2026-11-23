import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'

const { billingAll: billingEnabled } = isFeatureEnabled(['billing:all'])

export const storage: NavMenuConstant = {
  icon: 'storage',
  title: 'Storage',
  url: '/guides/storage',
  items: [
    {
      name: 'File Buckets',
      items: [
        { name: 'Quickstart', url: '/guides/storage/quickstart' },
        { name: 'Fundamentals', url: '/guides/storage/buckets/fundamentals' },
        { name: 'Creating buckets', url: '/guides/storage/buckets/creating-buckets' },
        {
          name: 'Access control and schema',
          items: [
            { name: 'Ownership', url: '/guides/storage/security/ownership' },
            { name: 'Access control', url: '/guides/storage/security/access-control' },
            { name: 'Storage schema design', url: '/guides/storage/schema/design' },
            { name: 'Helper Functions', url: '/guides/storage/schema/helper-functions' },
            { name: 'Custom roles', url: '/guides/storage/schema/custom-roles' },
            { name: 'URL signing keys', url: '/guides/storage/security/signing-keys' },
          ],
        },
        {
          name: 'Uploads and S3',
          items: [
            { name: 'Standard uploads', url: '/guides/storage/uploads/standard-uploads' },
            { name: 'Resumable uploads', url: '/guides/storage/uploads/resumable-uploads' },
            { name: 'S3 uploads', url: '/guides/storage/uploads/s3-uploads' },
            {
              name: 'Upload limits',
              url: '/guides/storage/uploads/file-limits',
              enabled: billingEnabled,
            },
            { name: 'S3 authentication', url: '/guides/storage/s3/authentication' },
            { name: 'S3 API compatibility', url: '/guides/storage/s3/compatibility' },
          ],
        },
        {
          name: 'Serving and CDN',
          items: [
            { name: 'Serving assets', url: '/guides/storage/serving/downloads' },
            {
              name: 'Image transformations',
              url: '/guides/storage/serving/image-transformations',
            },
            {
              name: 'Bandwidth and Storage egress',
              url: '/guides/storage/serving/bandwidth',
              enabled: billingEnabled,
            },
            { name: 'CDN fundamentals', url: '/guides/storage/cdn/fundamentals' },
            { name: 'Smart CDN', url: '/guides/storage/cdn/smart-cdn' },
            { name: 'Purging cache', url: '/guides/storage/cdn/purge-cdn-cache' },
            { name: 'CDN metrics', url: '/guides/storage/cdn/metrics' },
          ],
        },
        {
          name: 'Managing objects',
          items: [
            { name: 'Copy or move objects', url: '/guides/storage/management/copy-move-objects' },
            { name: 'Delete objects', url: '/guides/storage/management/delete-objects' },
            { name: 'Download objects', url: '/guides/storage/management/download-objects' },
          ],
        },
      ],
    },
    {
      name: 'Analytics Buckets',
      items: [
        {
          name: 'Creating buckets',
          url: '/guides/storage/analytics/creating-analytics-buckets',
        },
        {
          name: 'Iceberg catalog',
          url: '/guides/storage/analytics/connecting-to-analytics-bucket',
        },
        { name: 'Query with Postgres', url: '/guides/storage/analytics/query-with-postgres' },
        {
          name: 'Examples',
          items: [
            { name: 'Overview', url: '/guides/storage/analytics/examples' },
            { name: 'Using DuckDB', url: '/guides/storage/analytics/examples/duckdb' },
            { name: 'Using PyIceberg', url: '/guides/storage/analytics/examples/pyiceberg' },
            { name: 'Using Apache Spark', url: '/guides/storage/analytics/examples/apache-spark' },
          ],
        },
        { name: 'Limits', url: '/guides/storage/analytics/limits', enabled: billingEnabled },
        { name: 'Pricing', url: '/guides/storage/analytics/pricing', enabled: billingEnabled },
      ],
    },
    {
      name: 'Vector Buckets',
      items: [
        { name: 'Creating buckets', url: '/guides/storage/vector/creating-vector-buckets' },
        { name: 'Working with indexes', url: '/guides/storage/vector/working-with-indexes' },
        { name: 'Storing Vectors', url: '/guides/storage/vector/storing-vectors' },
        { name: 'Querying Vectors', url: '/guides/storage/vector/querying-vectors' },
        {
          name: 'Local development',
          url: '/guides/storage/vector/local-development',
          enabled: billingEnabled,
        },
        { name: 'Limits', url: '/guides/storage/vector/limits', enabled: billingEnabled },
      ],
    },
    {
      name: 'Debugging',
      items: [
        { name: 'Storage logs', url: '/guides/storage/debugging/logs' },
        { name: 'Error codes', url: '/guides/storage/debugging/error-codes' },
      ],
    },
    { name: 'Scaling for production', url: '/guides/storage/production/scaling' },
    { name: 'Storage pricing', url: '/guides/storage/pricing', enabled: billingEnabled },
    {
      name: 'Migrate from Firebase',
      url: 'https://supabase.com/kb/guides/migrate-from-firebase-storage',
    },
  ],
}
