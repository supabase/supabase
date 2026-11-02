import type { CompetitorProfile } from './types'

export const convex = {
  id: 'convex',
  name: 'Convex',
  last_verified: '2026-11-02',
  deployment: {
    license: {
      value: { tier: 'fair_source', spdx_id: null },
      notes:
        'Licensed under FSL with an Apache 2.0 conversion after two years. Self-hosting is allowed except for building a product that competes with Convex Cloud.',
      sourcing_urls: [
        'https://docs.convex.dev/open-source',
        'https://news.convex.dev/convex-goes-open-source/',
      ],
    },
    open_source_scope: {
      value: ['backend_services', 'dashboard'],
      notes:
        'The self-hosted backend runs the same code as Convex Cloud. The dashboard is included.',
      sourcing_urls: [
        'https://docs.convex.dev/open-source',
        'https://docs.convex.dev/self-hosting',
      ],
    },
    self_host: {
      value: 'official_guide',
      notes:
        'The official self-hosting guide is in the convex-backend repository. The docs say self-hosting is not for everyone and point to the hosted product. Support is through Discord.',
      sourcing_urls: ['https://docs.convex.dev/self-hosting'],
    },
  },
  portability: {
    wire_protocol: {
      value: 'proprietary',
      notes:
        'Clients call TypeScript functions over Convex’s own protocol. There is no SQL wire interface.',
      sourcing_urls: ['https://docs.convex.dev/database/types'],
    },
    query_model: {
      value: 'document',
      notes: 'Documents are JavaScript objects. Queries use index-based JavaScript, not SQL.',
      sourcing_urls: ['https://docs.convex.dev/database/types'],
    },
    upstream_projects: {
      value: [],
      notes: 'No upstream project was identified in this pass.',
      sourcing_urls: [],
    },
  },
} satisfies CompetitorProfile
