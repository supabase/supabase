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
        'supabase',
        'supabase-js',
        'supabase-dart',
        'supabase-flutter',
        'supabase-audit',
        'wrappers',
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
        'edge-isServerRuntime',
        'supabase',
        'self-hosted-edge-functions-demo',
        'functions-js',
        'functions-relay',
      ],
    },
    {
      label: 'Realtime',
      icon: products.realtime.icon[16],
      repos: ['realtime', 'realtime-js', 'realtime-dart'],
    },
    {
      label: 'Vector',
      icon: products.vector.icon[16],
      repos: ['pgvector', 'vecs'],
    },
  ],
}
