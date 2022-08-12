const buildNavbar = ({ baseUrl }) => {
  return [
    {
      to: '/',
      label: 'Guides',
      activeBaseRegex: `.*.docs/$|^/${baseUrl}/architecture|(^/${baseUrl}/guides/(database|auth|storage|api|examples!))|(^/${baseUrl}/guides/(examples|with-angular|with-flutter|with-nextjs|with-nuxt-3|with-react|with-redwoodjs|with-svelte|with-vue-3)|^/${baseUrl}/faq|^/${baseUrl}/going-into-prod|^/${baseUrl}/handbook|^/${baseUrl}/company)`,
      position: 'left',
    },
    {
      to: '/reference',
      label: 'Reference',
      position: 'left',
      activeBaseRegex: `^/${baseUrl}/reference$|^/${baseUrl}/reference/$`, // exactly match "/${baseUrl}/reference/" only
    },
    { href: 'https://app.supabase.com', label: 'Login', position: 'right' },
    {
      href: 'https://github.com/supabase/supabase',
      className: 'navbar-item-github',
      position: 'right',
    },
    {
      href: 'https://discord.supabase.com',
      className: 'navbar-item-discord',
      position: 'right',
    },
    {
      href: 'https://twitter.com/supabase',
      className: 'navbar-item-twitter',
      position: 'right',
    },
    /**
     * OFFICIAL REFERENCE
     */
    // API
    {
      to: 'reference/api',
      position: 'left',
      label: 'API',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/api$|${baseUrl}/reference/api/)`,
    },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_api',
    //   supabaseCustomNavBarRegex: '(^/api$|api/)',
    // },
    // CLI
    {
      to: 'reference/cli',
      position: 'left',
      label: 'CLI',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/cli$|${baseUrl}/reference/cli/)`,
    },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_cli',
    //   supabaseCustomNavBarRegex: '(^/cli$|cli/)',
    // },
    // supabase-js
    {
      to: 'reference/javascript',
      position: 'left',
      label: 'JavaScript Library',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/javascript$|${baseUrl}/reference/javascript/)`,
    },
    {
      type: 'docsVersionDropdown',
      position: 'left',
      docsPluginId: '_supabase_js',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/javascript$|${baseUrl}/reference/javascript/)`,
    },
    /**
     * TOOLS
     */
    // GoTrue
    {
      to: 'reference/auth',
      position: 'left',
      label: 'Auth Server',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/auth$|${baseUrl}/reference/auth/)`,
    },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_gotrue',
    //   supabaseCustomNavBarRegex: '(^/gotrue$|gotrue/)',
    // },
    // Storage
    {
      to: 'reference/storage',
      position: 'left',
      label: 'Storage Server',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/storage$|${baseUrl}/reference/storage/)`,
    },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_storage',
    //   supabaseCustomNavBarRegex: '(^/storage$|storage/)',
    // },
    /**
     * COMMUNITY
     */
    {
      to: 'reference/supabase-dart',
      position: 'left',
      label: 'Dart Library',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/dart$|${baseUrl}/reference/dart/)`,
    },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_supabase_dart',
    //   supabaseCustomNavBarRegex: '(^/supabase-dart$|supabase-dart/)',
    // },
    {
      to: 'reference/auth-helpers',
      position: 'left',
      label: 'Auth Helpers',
      supabaseCustomNavBarRegex: `(^/${baseUrl}/reference/auth-helpers$|${baseUrl}/reference/auth-helpers/)`,
    },
    // {
    //   type: 'docsVersionDropdown',
    //   position: 'left',
    //   docsPluginId: '_auth_helpers',
    //   supabaseCustomNavBarRegex: '(^/auth-helpers$|auth-helpers/)',
    // // },
  ]
}

module.exports = { buildNavbar }
