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
  favicon: '/favicon.ico',
  organizationName: 'supabase', // Usually your GitHub org/user name.
  projectName: 'supabase', // Usually your repo name.
  themeConfig: {
    algolia: {
      apiKey: '766d56f13dd1e82f43253559b7c86636',
      indexName: 'supabase',
    },
    darkMode: true,
    image: 'favicon.png', // used for meta tag, in particular og:image and twitter:image
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
        //   href: 'https://github.com/supabase/supabase',
        //   label: 'GitHub',
        //   position: 'right',
        // },
        // {
        //   href: 'https://app.supabase.io',
        //   label: 'Join the List →',
        //   position: 'right',
        // },
      ],
    },
    prism: {
      defaultLanguage: 'js',
      plugins: ['line-numbers', 'show-language'],
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
              label: 'Opensource',
              to: '/oss',
            },
            {
              label: 'Humans',
              to: 'https://supabase.io/humans.txt',
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
  // customFields: {
  //   headerJs: `
  //     // FULLSTORY - Please remove after initial user testing.
  //     window['_fs_debug'] = false;
  //     window['_fs_host'] = 'fullstory.com';
  //     window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
  //     window['_fs_org'] = 'R5A9Z';
  //     window['_fs_namespace'] = 'FS';
  //     (function(m,n,e,t,l,o,g,y){
  //         if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
  //         g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
  //         o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
  //         y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
  //         g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
  //         g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
  //         g.log = function(a,b) { g("log", [a,b]) };
  //         g.consent=function(a){g("consent",!arguments.length||a)};
  //         g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
  //         g.clearUserCookie=function(){};
  //     })(window,document,window['_fs_namespace'],'script','user');
  //   `,
  // },
}
