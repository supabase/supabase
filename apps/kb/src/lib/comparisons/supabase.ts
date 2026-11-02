import type { CompetitorProfile } from './types'

export const supabase = {
  id: 'supabase',
  name: 'Supabase',
  last_verified: '2026-11-02',
  deployment: {
    license: {
      value: { tier: 'osi_open_source', spdx_id: 'Apache-2.0' },
      notes:
        'Checked on the root supabase/supabase LICENSE only. Individual component repositories may carry their own licenses.',
      sourcing_urls: ['https://github.com/supabase/supabase/blob/master/LICENSE'],
    },
    open_source_scope: {
      value: ['backend_services', 'dashboard'],
      notes:
        'Self-hostable components and Studio are in the open repository. The hosted control plane is not. Client SDK licensing was not checked individually.',
      sourcing_urls: [
        'https://supabase.com/docs/guides/self-hosting',
        'https://github.com/supabase/supabase/blob/master/LICENSE',
      ],
    },
    self_host: {
      value: 'official_docker',
      notes:
        'Docker Compose is the supported route. Branching, managed backups and PITR, the Management API, and multi-project Studio are not available when self-hosting.',
      sourcing_urls: ['https://supabase.com/docs/guides/self-hosting'],
    },
  },
  portability: {
    wire_protocol: {
      value: 'postgres',
      notes: 'Every project gets a full Postgres database, not a Postgres abstraction.',
      sourcing_urls: ['https://supabase.com/docs/guides/database/overview'],
    },
    query_model: {
      value: 'sql',
      sourcing_urls: ['https://supabase.com/docs/guides/database/overview'],
    },
    upstream_projects: {
      value: [{ name: 'PostgreSQL', license: 'PostgreSQL', cncf_status: null }],
      notes: 'License checked against the PostgreSQL licence page.',
      sourcing_urls: [
        'https://supabase.com/docs/guides/database/overview',
        'https://www.postgresql.org/about/licence/',
      ],
    },
  },
} satisfies CompetitorProfile
