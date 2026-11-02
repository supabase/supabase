import type { CompetitorProfile } from './types'

export const neon = {
  name: 'Neon',
  last_verified: '2026-11-02',
  deployment: {
    license: {
      value: { tier: 'osi_open_source', spdx_id: 'Apache-2.0' },
      notes:
        'Checked on the neondatabase/neon repository LICENSE. Hosted control plane licensing was not checked.',
      sourcing_urls: ['https://github.com/neondatabase/neon/blob/main/LICENSE'],
    },
    open_source_scope: {
      value: ['storage_engine'],
      notes:
        'The repository includes the pageserver and safekeeper, which make up the storage engine. The Postgres fork lives in a separate repository that was not checked, so database_engine is left out.',
      sourcing_urls: ['https://github.com/neondatabase/neon'],
    },
    self_host: {
      value: 'community_only',
      notes:
        'The source is public, but no official self-hosting guide was found. Self-hosting also needs external S3-compatible object storage.',
      sourcing_urls: ['https://github.com/neondatabase/neon'],
    },
  },
  portability: {
    wire_protocol: {
      value: ['postgres'],
      notes: 'Neon is Postgres-compatible, and its compute runs Postgres.',
      sourcing_urls: ['https://github.com/neondatabase/neon'],
    },
    query_model: {
      value: 'sql',
      sourcing_urls: ['https://github.com/neondatabase/neon'],
    },
    upstream_projects: {
      value: [{ name: 'PostgreSQL', license: 'PostgreSQL', cncf_status: null }],
      notes: 'License checked against the PostgreSQL licence page.',
      sourcing_urls: [
        'https://github.com/neondatabase/neon',
        'https://www.postgresql.org/about/licence/',
      ],
    },
    export_tool: {
      value: 'pg_dump and pg_restore',
      sourcing_urls: ['https://neon.com/docs/import/import-from-postgres'],
    },
    export_format: {
      value: 'pg_dump',
      notes: 'The docs recommend the custom format (-Fc). Plain SQL also works with psql.',
      sourcing_urls: ['https://neon.com/docs/import/import-from-postgres'],
    },
    loads_into_standard_server: {
      value: true,
      notes:
        'Use an unpooled connection string for dump and restore. Neon supports PostgreSQL 14 through 17.',
      sourcing_urls: ['https://neon.com/docs/import/import-from-postgres'],
    },
  },
} satisfies CompetitorProfile
