import { products } from 'shared-data'

export default {
  metaTitle: 'Supabase Open Source Community',
  metaDescription:
    'Supabase is an open source company, actively fostering collaboration and supporting existing open source tools and communities.',
  heroSection: {
    title: 'The Power of Collaboration',
    h1: <span className="heading-gradient">Open Source Community</span>,
    subheader: (
      <>
        Supabase is an open source company, actively fostering collaboration and supporting existing
        open source tools and communities.
      </>
    ),
  },
  repo_tabs: [
    // {
    //   label: 'Generic',
    //   icon: '',
    //   repos: [
    //     'supabase',
    //     'supavisor',
    //     'supabase-cli',
    //     'supabase-js',
    //     'supabase-dart',
    //     'supabase-flutter',
    //     'supabase-audit',
    //   ],
    // },
    {
      label: 'Database',
      icon: products.database.icon[16],
      repos: [
        'wrappers',
        'pg_graphql',
        'postgres',
        'postgres-deno',
        'postgrest-dart',
        'postgrest-js',
        'postgres-meta',
        'supabase',
        'supabase-dart',
        'supabase-js',
        'supabase-flutter',
        'supabase-audit',
        'supautils',
      ],
    },
    {
      label: 'Auth',
      icon: products.authentication.icon[16],
      repos: [
        'supabase',
        'supabase-cli',
        'supabase-js',
        'auth-helpers',
        'auth-elements',
        'auth-ui',
        'mailme',
      ],
    },
    {
      label: 'Storage',
      icon: products.storage.icon[16],
      repos: ['storage-api', 'supabase', 'storage-js', 'storage-dart'],
    },
    {
      label: 'Edge Functions',
      icon: products.functions.icon[16],
      repos: [
        'edge-runtime',
        'supabase',
        'postgres-deno',
        'self-hosted-edge-functions-demo',
        'functions-js',
        'functions-relay',
        'supabase',
        'supabase-js',
      ],
    },
    {
      label: 'Realtime',
      icon: products.realtime.icon[16],
      repos: ['realtime', 'realtime-js', 'realtime-dart', 'supabase', 'supabase-js'],
    },
    {
      label: 'Vector',
      icon: products.vector.icon[16],
      repos: [
        'embeddings-generator',
        'headless-vector-search',
        'pgvector',
        'supabase',
        'supabase-js',
        'vecs',
      ],
    },
    {
      label: 'Other',
      repos: ['design-tokens', 'ui', 'supabase-ui-web'],
    },
  ],
}
