const navbar = [
  {
    to: '/',
    label: 'Guides',
    activeBaseRegex:
      '.*.docs/$|^/docs/architecture|(^/docs/guides/(database|auth|storage|api|examples!))|(^/docs/guides/(examples|with-angular|with-flutter|with-nextjs|with-nuxt-3|with-react|with-redwoodjs|with-svelte|with-vue-3)|^/docs/faq|^/docs/going-into-prod|^/docs/handbook|^/docs/company)',
    position: 'left',
  },
  {
    to: '/reference',
    label: 'Reference',
    position: 'left',
    activeBaseRegex: '^/docs/reference$|^/docs/reference/$', // exactly match "/docs/reference/" only
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
    supabaseCustomNavBarRegex: '(^/docs/reference/api$|docs/reference/api/)',
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
    supabaseCustomNavBarRegex: '(^/docs/reference/cli$|docs/reference/cli/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_cli',
  //   supabaseCustomNavBarRegex: '(^/cli$|cli/)',
  // },

  // supabase-js
  // {
  //   to: 'reference/javascript',
  //   position: 'left',
  //   label: 'JavaScript Library',
  //   supabaseCustomNavBarRegex:
  //     '(^/docs/reference/javascript$|docs/reference/javascript/)',
  // },
  {
    type: 'docsVersionDropdown',
    position: 'left',
    docsPluginId: '_supabase_js',
    supabaseCustomNavBarRegex:
      '(^/docs/reference/javascript$|docs/reference/javascript/)',
  },

  /**
   * TOOLS
   */

  // GoTrue
  {
    to: 'reference/auth',
    position: 'left',
    label: 'Auth Server',
    supabaseCustomNavBarRegex: '(^/docs/reference/auth$|docs/reference/auth/)',
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
    supabaseCustomNavBarRegex:
      '(^/docs/reference/storage$|docs/reference/storage/)',
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
    supabaseCustomNavBarRegex: '(^/docs/reference/dart$|docs/reference/dart/)',
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
    supabaseCustomNavBarRegex:
      '(^/docs/reference/auth-helpers$|docs/reference/auth-helpers/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_auth_helpers',
  //   supabaseCustomNavBarRegex: '(^/auth-helpers$|auth-helpers/)',
  // },
]

module.exports = { navbar }
