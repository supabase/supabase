/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
module.exports = {
  title: 'Supabase',
  tagline: 'The open source Firebase alternative.',
  url: 'https://supabase.com',
  baseUrl: '/docs/',
  favicon: '/favicon.ico',
  organizationName: 'supabase', // Usually your GitHub org/user name.
  projectName: 'Supabase Docs', // Usually your repo name.
  onBrokenLinks: 'ignore',
  themeConfig: {
    colorMode: {
      // "light" | "dark"
      defaultMode: 'dark',

      // Hides the switch in the navbar
      // Useful if you want to support a single color mode
      disableSwitch: false,

      // Should we use the prefers-color-scheme media-query,
      // using user system preferences, instead of the hardcoded defaultMode
      respectPrefersColorScheme: false,

      // Dark/light switch icon options
      switchConfig: {
        // Icon for the switch while in dark mode
        darkIcon: '  ',
        darkIconStyle: {
          marginTop: '1px',
        },
        lightIcon: '  ',
        lightIconStyle: {
          marginTop: '1px',
        },
      },
    },
    algolia: {
      apiKey: '766d56f13dd1e82f43253559b7c86636',
      appId: 'supabase',
      indexName: 'supabase',
    },
    image: '/img/supabase-og-image.png', // used for meta tag, in particular og:image and twitter:image
    metaImage: '/img/supabase-og-image.png',
    navbar: {
      // classNames: 'shadow--md',
      // title: 'supabase',
      hideOnScroll: true,
      logo: {
        alt: 'Supabase',
        src: '/supabase-light.svg',
        srcDark: '/supabase-dark.svg',
      },
      items: [
        {
          label: 'Guides',
          to: '/',
          activeBaseRegex:
            '.*.docs/$|^/docs/architecture|(^/docs/guides/(database|auth|storage|api|examples!))|(^/docs/guides/(examples|with-angular|with-flutter|with-nextjs|with-react|with-redwoodjs|with-svelte|with-vue-3)|^/docs/faq|^/docs/going-into-prod|^/docs/handbook|^/docs/company)',
          position: 'left',
        },
        {
          label: 'Reference',
          to: '/docs/reference/javascript/supabase-client',
          activeBasePath: '/docs/reference/',
          position: 'left',
        },
        { href: 'https://app.supabase.io', label: 'Login', position: 'left' },
        {
          href: 'https://github.com/supabase/supabase',
          className: 'navbar-item-github',
          position: 'right',
        },
        {
          href: 'https://twitter.com/supabase',
          className: 'navbar-item-twitter',
          position: 'right',
        },
      ],
    },
    prism: {
      defaultLanguage: 'js',
      additionalLanguages: ['dart'],
      plugins: ['line-numbers', 'show-language'],
      theme: require('@kiwicopple/prism-react-renderer/themes/vsDark'),
      darkTheme: require('@kiwicopple/prism-react-renderer/themes/vsDark'),
    },
    footer: {
      links: [
        {
          title: 'Company',
          items: [
            {
              label: 'Blog',
              to: 'https://supabase.com/blog',
            },
            {
              label: 'Open source',
              to: '/oss',
            },
            {
              label: 'Humans.txt',
              to: 'https://supabase.com/humans.txt',
            },
            {
              label: 'Lawyers.txt',
              to: 'https://supabase.com/lawyers.txt',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Brand Assets',
              to: 'https://supabase.com/brand-assets',
            },
            {
              label: 'Docs',
              to: '/',
            },
            {
              label: 'Pricing',
              to: 'https://supabase.com/pricing',
            },
            {
              label: 'Support',
              to: '/support',
            },
            {
              label: 'System Status',
              to: 'https://status.supabase.com/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/supabase/supabase',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/supabase',
            },
            {
              label: 'DevTo',
              href: 'https://dev.to/supabase',
            },
            {
              label: 'RSS',
              href: 'https://supabase.com/rss.xml',
            },
            {
              label: 'Discord',
              href: 'https://discord.supabase.com',
            },
          ],
        },
        {
          title: 'Beta',
          items: [
            {
              label: 'Join our beta',
              href: 'https://app.supabase.io',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Supabase.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/supabase/supabase/edit/master/web',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        blog: {
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Supabase, Inc.`,
          },
        },
      },
    ],
  ],
  scripts: [{ src: '/scripts/telemetry.js' }],
  // plugins: [
  //   // [
  //   //   '@docusaurus/plugin-content-docs',
  //   //   {
  //   //     id: 'supabase-client', // for first plugin-content-docs with "resources/" path
  //   //     // homePageId: "doc2",
  //   //     path: './ref/supabase', // Path to data on filesystem, relative to site dir.
  //   //     routeBasePath: 'ref/supabase', // URL Route.
  //   //     include: ['**/*.md', '**/*.mdx'],
  //   //     sidebarPath: require.resolve('./sidebar_spec_supabase.js'),
  //   //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
  //   //   },
  //   // ],
  //   // [
  //   //   '@docusaurus/plugin-content-docs',
  //   //   {
  //   //     id: 'postgrest-client', // for first plugin-content-docs with "resources/" path
  //   //     // homePageId: "doc2",
  //   //     path: './ref/postgrest', // Path to data on filesystem, relative to site dir.
  //   //     routeBasePath: 'ref/postgrest', // URL Route.
  //   //     include: ['**/*.md', '**/*.mdx'],
  //   //     sidebarPath: require.resolve('./sidebar_spec_postgrest.js'),
  //   //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
  //   //   },
  //   // ],
  //   // [
  //   //   '@docusaurus/plugin-content-docs',
  //   //   {
  //   //     id: 'gotrue-client', // for first plugin-content-docs with "resources/" path
  //   //     // homePageId: "doc2",
  //   //     path: './ref/gotrue', // Path to data on filesystem, relative to site dir.
  //   //     routeBasePath: 'ref/gotrue', // URL Route.
  //   //     include: ['**/*.md', '**/*.mdx'],
  //   //     sidebarPath: require.resolve('./sidebar_spec_gotrue.js'),
  //   //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
  //   //   },
  //   // ],
  //   // [
  //   //   '@docusaurus/plugin-content-docs',
  //   //   {
  //   //     id: 'realtime-client', // for first plugin-content-docs with "resources/" path
  //   //     // homePageId: "doc2",
  //   //     path: './ref/realtime', // Path to data on filesystem, relative to site dir.
  //   //     routeBasePath: 'ref/realtime', // URL Route.
  //   //     include: ['**/*.md', '**/*.mdx'],
  //   //     sidebarPath: require.resolve('./sidebar_spec_realtime.js'),
  //   //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
  //   //   },
  //   // ],
  //   // [
  //   //   '@docusaurus/plugin-content-docs',
  //   //   {
  //   //     id: 'realtime-server', // for first plugin-content-docs with "resources/" path
  //   //     path: './tools/realtime', // Path to data on filesystem, relative to site dir.
  //   //     routeBasePath: 'docs/realtime', // URL Route.
  //   //     include: ['**/*.md', '**/*.mdx'],
  //   //     sidebarPath: require.resolve('./sidebar_realtime_server.js'),
  //   //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
  //   //   },
  //   // ],
  //   // [
  //   //   '@docusaurus/plugin-content-docs',
  //   //   {
  //   //     id: 'postgrest', // for first plugin-content-docs with "resources/" path
  //   //     // homePageId: "doc2",
  //   //     path: './ref/postgrest', // Path to data on filesystem, relative to site dir.
  //   //     routeBasePath: 'ref/postgrest', // URL Route.
  //   //     include: ['**/*.md', '**/*.mdx'],
  //   //     sidebarPath: require.resolve('./sidebar_spec_postgrest.js'),
  //   //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
  //   //   },
  //   // ],
  // ],
}
