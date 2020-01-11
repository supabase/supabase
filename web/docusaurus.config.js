/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  title: 'Supabase',
  tagline: 'realtime postgres.',
  url: 'https://supabase.io',
  baseUrl: '/',
  favicon: '/static/favicon.ico',
  organizationName: 'supabase', // Usually your GitHub org/user name.
  projectName: 'supabase', // Usually your repo name.
  themeConfig: {
    darkMode: true,
    googleAnalytics: {
      trackingID: 'UA-155232740-1',
    },
    navbar: {
      classNames: 'shadow--md',
      // title: 'supabase',
      logo: {
        alt: 'Supabase',
        src: '/supabase-light.svg',
        dark: '/supabase-dark.svg',
      },
      links: [
        { to: '/docs/about', label: 'Docs', position: 'right' },
        { to: '/docs/guides/examples', label: 'Guides', position: 'right' },
        // {
        //   href: 'https://github.com/supabase/monorepo',
        //   label: 'GitHub',
        //   position: 'right',
        // },
        {
          href: 'https://app.supabase.io',
          label: 'Join the List →',
          position: 'right',
        },
      ],
    },
    prism: {
      defaultLanguage: 'js',
      plugins: ['line-numbers', 'show-language']
    },
    footer: {
      links: [
        {
          title: 'Company',
          items: [
            {
              label: 'Docs',
              to: '/docs/about',
            },
            {
              label: 'Guides',
              to: '/docs/guides/examples',
            },
            {
              label: 'Humans',
              to: '/static/humans.txt',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/supabase/monorepo',
            },
            // {
            //   label: "Discord",
            //   href: "https://discordapp.com/invite/docusaurus"
            // }
          ],
        },
        // {
        //   title: "Social",
        //   items: [
        //     {
        //       label: "Blog",
        //       to: "blog"
        //     }
        //   ]
        // }
      ],
      // logo: {
      //   alt: "Flock",
      //   src: "/img/logo-white.svg",
      //   // href: "https://opensource.facebook.com/"
      // },
      copyright: `Copyright © ${new Date().getFullYear()} Supabase.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
}
