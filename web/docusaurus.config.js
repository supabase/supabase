/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  title: 'Supabase',
  tagline: 'The open source Firebase alternative.',
  url: 'https://supabase.io',
  baseUrl: '/',
  favicon: '/favicon.ico',
  organizationName: 'supabase', // Usually your GitHub org/user name.
  projectName: 'supabase', // Usually your repo name.
  themeConfig: {
    forceDarkMode: true,
    darkMode: true,
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
    sidebarCollapsible: false,
    algolia: {
      apiKey: '766d56f13dd1e82f43253559b7c86636',
      indexName: 'supabase',
    },
    image: '/img/supabase-og-image.png', // used for meta tag, in particular og:image and twitter:image
    metaImage: '/img/supabase-og-image.png',
    googleAnalytics: {
      trackingID: 'UA-155232740-1',
    },
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
          to: 'docs/',
          activeBasePath: 'Docs',
          label: 'Docs',
          position: 'right',
          items: [
            {
              label: 'Getting started',
              to: '/docs',
            },
            {
              label: 'GoTrue Client',
              to: '/ref/gotrue',
            },
          ],
        },
        { to: '/docs/pricing', label: 'Pricing', position: 'right' },
        { to: '/blog', label: 'Blog', position: 'right' },
        { href: 'https://app.supabase.io', label: 'Login', position: 'right' },
        {
          href: 'https://github.com/supabase/supabase',
          className: 'navbar-item-github',
          position: 'right',
        },
      ],
    },
    prism: {
      defaultLanguage: 'js',
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
              label: 'Humans',
              to: 'https://supabase.io/humans.txt',
            },
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Open source',
              to: '/oss',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Docs',
              to: '/docs',
            },
            {
              label: 'Pricing',
              to: '/docs/pricing',
            },
            {
              label: 'Support',
              to: '/docs/support',
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
              href: 'https://twitter.com/supabase_io',
            },
            {
              label: 'DevTo',
              href: 'https://dev.to/supabase',
            },
            {
              label: 'Stackshare',
              href: 'https://stackshare.io/supabase',
            },
            {
              label: 'Product Hunt',
              href: 'https://www.producthunt.com/posts/supabase-alpha',
            },
            // {
            //   label: "Discord",
            //   href: "https://discordapp.com/invite/docusaurus"
            // }
          ],
        },
        {
          title: 'Alpha',
          items: [
            {
              label: 'Join our alpha',
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
          id: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'gotrue', // for first plugin-content-docs with "resources/" path
        // homePageId: "doc2",
        path: './ref/gotrue', // Path to data on filesystem, relative to site dir.
        routeBasePath: 'ref/gotrue', // URL Route.
        include: ['**/*.md', '**/*.mdx'],
        sidebarPath: require.resolve('./sidebar_spec_gotrue.js'),
        // disableVersioning: true, // if not set with vesions, throw: Identifier 'React' has already been declared
      },
    ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'postgrest', // for first plugin-content-docs with "resources/" path
    //     // homePageId: "doc2",
    //     path: './ref/postgrest', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'ref/postgrest', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_spec_postgrest.js'),
    //     // disableVersioning: true, // if not set with vesions, throw: Identifier 'React' has already been declared
    //   },
    // ],
  ],
}
