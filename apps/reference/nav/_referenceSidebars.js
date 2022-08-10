/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Reference',
      link: { type: 'doc', id: 'about' },
      collapsed: false,
      items: [
        { type: 'link', label: 'Supabase CLI', href: '/cli' },
        { type: 'link', label: 'Supabase API', href: '/api' },
        {
          type: 'link',
          label: 'Supabase JavaScript Library',
          href: '/supabase-js',
        },
        {
          type: 'link',
          label: 'Supabase Dart Library',
          href: '/supabase-dart',
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
          href: '/auth-helpers',
        },
      ],
    },
    {
      type: 'category',
      label: 'Self hosted',
      collapsed: false,
      items: [
        { type: 'link', label: 'Auth Server', href: '/auth' },
        { type: 'link', label: 'Storage Server', href: '/storage' },
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
