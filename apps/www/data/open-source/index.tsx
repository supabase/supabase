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
        'postgres-wasm',
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
  sponsorships: [
    {
      name: 'postgrest',
      description:
        'PostgREST is a standalone web server that turns your PostgreSQL database directly into a RESTful API.',
      full_name: '/PostgREST/postgrest',
      isGithub: true,
      url: 'https://github.com/PostgREST/postgrest',
    },
    {
      name: 'pgroonga',
      description:
        'PGroonga is a PostgreSQL extension to use Groonga as index. PGroonga makes PostgreSQL fast full text search platform for all languages!',
      full_name: '/pgroonga/pgroonga',
      isGithub: true,
      url: 'https://github.com/pgroonga/pgroonga',
    },
    {
      name: 'pgsodium',
      description: 'Modern cryptography for PostgreSQL using libsodium.',
      full_name: '/michelp/pgsodium',
      isGithub: true,
      url: 'https://github.com/michelp/pgsodium',
    },
    {
      name: 'Open Collective Profile',
      description: 'We have contributed with more than $250,000 on paying sponsorships.',
      url: 'https://github.com/PostgREST/postgrest',
    },
    {
      name: 'OrioleDB',
      description: 'Sponsoring OrioleDB – the next generation storage engine for PostgreSQL',
      url: 'https://www.socallinuxexpo.org/sites/default/files/presentations/solving-postgres-wicked-problems.pdf',
    },
    {
      name: 'Elixir',
      description:
        'Elixir is a dynamic, functional language for building scalable and maintainable applications.',
      url: 'https://elixir-lang.org/blog/2022/10/05/my-future-with-elixir-set-theoretic-types/#:~:text=is%20sponsored%20by-,Supabase,-(they%20are',
    },
  ],
}
