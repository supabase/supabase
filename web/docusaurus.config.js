/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  title: 'Supabase',
  tagline: 'Instant Realtime API',
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
      title: '',
      logo: {
        alt: 'Supabase',
        src: '/supabase-logo.svg',
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
          label: 'Get Early Access →',
          position: 'right',
        },
      ],
    },
    prism: {
      defaultLanguage: 'js',
      // https://github.com/FormidableLabs/prism-react-renderer/tree/master/src/themes
      // theme: require('prism-react-renderer/themes/vsdark'),
    },
    footer: {
      links: [
        {
          title: "Company",
          items: [
            {
              label: "Docs",
              to: "/docs/about"
            },
            {
              label: "Guides",
              to: "/docs/guides/examples"
            },
            {
              label: "Blog",
              to: "/blog"
            }
          ]
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/supabase/monorepo"
            },
            // {
            //   label: "Discord",
            //   href: "https://discordapp.com/invite/docusaurus"
            // }
          ]
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
        }
      },
    ],
  ],
}
