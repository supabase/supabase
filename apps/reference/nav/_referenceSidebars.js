const sidebars = {
  guides: [
    {
      type: 'category',
      label: 'Overview',
      items: ['about'],
      collapsed: true,
    },
  ],
  reference: [
    {
      type: 'category',
      label: 'Reference',
      link: { type: 'doc', id: 'reference' },
      collapsed: false,
      items: [
        { type: 'link', label: 'Supabase CLI', href: '/reference/cli' },
        { type: 'link', label: 'Supabase API', href: '/reference/api' },
        {
          type: 'link',
          label: 'Supabase JavaScript Library',
          href: '/reference/javascript',
        },
        {
          type: 'link',
          label: 'Supabase Dart Library',
          href: '/reference/dart',
        },
      ],
    },
    {
      type: 'category',
      label: 'Community',
      collapsed: false,
      items: [
        {
          type: 'link',
          label: 'Supabase Auth Helpers',
          href: '/reference/auth-helpers',
        },
      ],
    },
    {
      type: 'category',
      label: 'Self hosted',
      collapsed: false,
      items: [
        { type: 'link', label: 'Auth Server', href: '/reference/auth' },
        { type: 'link', label: 'Storage Server', href: '/reference/storage' },
      ],
    },
    // {
    //   type: 'category',
    //   label: 'Postgres Extensions',
    //   link: { type: 'doc', id: 'postgres/extensions/intro' },
    //   collapsed: true,
    //   items: [
    //     'postgres/extensions/http',
    //     'postgres/extensions/pgtap',
    //     'postgres/extensions/plv8',
    //     'postgres/extensions/uuid-ossp',
    //   ],
    // },
  ],
}

module.exports = sidebars
