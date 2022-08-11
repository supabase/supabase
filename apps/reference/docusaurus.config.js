// @ts-nocheck
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')
const mainNavbar = require('./nav/_referenceNavbar')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Supabase Tools',
  tagline: 'Documentation for the Supabase Ecosystem',
  url: 'https://supabase.tools',
  baseUrl: '/',
  onBrokenLinks: 'ignore', // TODO: remove this when going into prod
  // onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'supabase', // Usually your GitHub org/user name.
  projectName: 'supabase.tools', // Usually your repo name.
  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_api',
        path: '_api',
        routeBasePath: 'api',
        sidebarPath: require.resolve('./nav/api_sidebars.js'),
        breadcrumbs: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_cli',
        path: '_cli',
        routeBasePath: 'cli',
        sidebarPath: require.resolve('./nav/cli_sidebars.js'),
        breadcrumbs: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_gotrue',
        path: '_gotrue',
        routeBasePath: 'auth',
        sidebarPath: require.resolve('./nav/gotrue_sidebars.js'),
        breadcrumbs: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_storage',
        path: '_storage',
        routeBasePath: 'storage',
        sidebarPath: require.resolve('./nav/storage_sidebars.js'),
        breadcrumbs: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_supabase_dart',
        path: '_supabase_dart',
        routeBasePath: 'supabase-dart',
        sidebarPath: require.resolve('./nav/supabase_dart_sidebars.js'),
        breadcrumbs: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_supabase_js',
        path: '_supabase_js',
        routeBasePath: 'supabase-js',
        sidebarPath: require.resolve('./nav/supabase_js_sidebars.js'),
        breadcrumbs: false,
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: '_auth_helpers',
        path: '_auth_helpers',
        routeBasePath: 'auth-helpers',
        sidebarPath: require.resolve('./nav/auth_helpers_sidebars.js'),
        breadcrumbs: false,
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // Serve the docs at the site's root
          sidebarPath: require.resolve('./nav/_referenceSidebars.js'),
          breadcrumbs: false,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        // title: 'Supabase Tools',
        logo: {
          alt: 'Supabase Tools',
          src: 'img/supabase-logo-wordmark--light.svg',
          srcDark: 'img/supabase-logo-wordmark--dark.svg',
        },
        items: mainNavbar.navbar,
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
                to: 'https://supabase.com/docs',
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
                href: 'https://app.supabase.com',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Supabase.`,
      },
      prism: {
        additionalLanguages: ['dart'],
        plugins: ['line-numbers', 'show-language'],
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
}

module.exports = config
