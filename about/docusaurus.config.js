module.exports = {
  title: 'Supabase',
  tagline: 'Build in a weekend. Scale to millions.',
  url: 'https://supabase.com',
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
    sidebarCollapsible: true,
    algolia: {
      apiKey: '766d56f13dd1e82f43253559b7c86636',
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
          href: 'https://github.com/supabase/supabase',
          className: 'navbar-item-github',
          position: 'right',
        },
        {
          href: 'https://twitter.com/supabase',
          className: 'navbar-item-twitter',
          position: 'right',
        },
        {
          label: 'Careers',
          to: 'https://boards.greenhouse.io/supabase',
          activeBasePath: '/careers',
          position: 'left',
        },
        {
          label: 'Handbook',
          to: '/handbook',
          activeBaseRegex: '/handbook',
          position: 'left',
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
          title: 'Team',
          items: [
            {
              label: 'Handbook',
              href: '/handbook',
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
              label: 'Discord',
              href: 'https://discord.supabase.com',
            },
            {
              label: 'RSS',
              href: 'https://supabase.com/rss.xml',
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
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        blog: false,
      },
    ],
  ],
  plugins: [
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'supabase-client', // for first plugin-content-docs with "resources/" path
    //     // homePageId: "doc2",
    //     path: './ref/supabase', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'ref/supabase', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_spec_supabase.js'),
    //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
    //   },
    // ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'postgrest-client', // for first plugin-content-docs with "resources/" path
    //     // homePageId: "doc2",
    //     path: './ref/postgrest', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'ref/postgrest', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_spec_postgrest.js'),
    //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
    //   },
    // ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'gotrue-client', // for first plugin-content-docs with "resources/" path
    //     // homePageId: "doc2",
    //     path: './ref/gotrue', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'ref/gotrue', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_spec_gotrue.js'),
    //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
    //   },
    // ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'realtime-client', // for first plugin-content-docs with "resources/" path
    //     // homePageId: "doc2",
    //     path: './ref/realtime', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'ref/realtime', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_spec_realtime.js'),
    //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
    //   },
    // ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'realtime-server', // for first plugin-content-docs with "resources/" path
    //     path: './tools/realtime', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'docs/realtime', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_realtime_server.js'),
    //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
    //   },
    // ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'postgrest', // for first plugin-content-docs with "resources/" path
    //     // homePageId: "doc2",
    //     path: './ref/postgrest', // Path to data on filesystem, relative to site dir.
    //     routeBasePath: 'ref/postgrest', // URL Route.
    //     include: ['**/*.md', '**/*.mdx'],
    //     sidebarPath: require.resolve('./sidebar_spec_postgrest.js'),
    //     // disableVersioning: true, // if not set with versions, throw: Identifier 'React' has already been declared
    //   },
    // ],
  ],
}
