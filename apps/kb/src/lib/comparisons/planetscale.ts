import type { CompetitorProfile } from './types'

export const planetscale = {
  id: 'planetscale',
  name: 'PlanetScale',
  last_verified: '2026-11-02',
  deployment: {
    license: {
      value: { tier: 'closed', spdx_id: null },
      notes:
        'Not confirmed against a primary source. PlanetScale’s public GitHub organization publishes client tooling under Apache-2.0, but none of the 10 repositories shown is the platform. The terms page could not be retrieved. The upstream Vitess project is Apache 2.0 (see portability.upstream_projects).',
      sourcing_urls: [
        'https://github.com/planetscale',
        'https://dbdb.io/db/planetscale/revisions/5',
      ],
    },
    open_source_scope: {
      value: [],
      notes:
        'No platform components are open. PlanetScale publishes open-source client tooling, such as its CLI and Terraform provider, but those are not in this scope. Vitess, its upstream, is open.',
      sourcing_urls: ['https://planetscale.com/docs/vitess'],
    },
    self_host: {
      value: 'none',
      notes:
        'Self-hosting Vitess is possible but gives sharding without PlanetScale’s branching and workflow layer. That is not a self-host path for PlanetScale itself.',
      sourcing_urls: ['https://vitess.io/docs/', 'https://planetscale.com/docs/vitess'],
    },
  },
  portability: {
    wire_protocol: {
      value: 'mysql',
      notes: 'MySQL-compatible via Vitess. PlanetScale also offers a Postgres product.',
      sourcing_urls: [
        'https://planetscale.com/docs/vitess',
        'https://dbdb.io/db/planetscale/revisions/5',
      ],
    },
    query_model: {
      value: 'sql',
      sourcing_urls: ['https://planetscale.com/docs/vitess'],
    },
    upstream_projects: {
      value: [{ name: 'Vitess', license: 'Apache-2.0', cncf_status: 'Graduated' }],
      notes: 'Graduated on November 5, 2019.',
      sourcing_urls: [
        'https://github.com/vitessio/vitess/blob/main/LICENSE',
        'https://www.cncf.io/projects/vitess/',
      ],
    },
  },
} satisfies CompetitorProfile
