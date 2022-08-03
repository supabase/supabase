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
  onBrokenLinks: 'throw',
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
            title: 'Reference',
            items: [
              {
                label: 'Supabase CLI',
                to: '/cli',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/supabase',
              },
              {
                label: 'Discord',
                href: 'https://discord.supabase.com',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/supabase',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Supabase Website',
                href: 'https://supabase.com',
              },
              {
                label: 'Supabase Docs',
                href: 'https://supabase.com/docs',
              },
              {
                label: 'Supabase GitHub',
                href: 'https://github.com/supabase/supabase',
              },
              {
                label: 'Supabase Community GitHub',
                href: 'https://github.com/supabase-community/supabase',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Supabase, Inc.`,
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
