const navbar = [
  {
    href: 'https://supabase.com/docs/guides',
    label: 'Guides',
    position: 'left',
  },
  {
    href: '/',
    label: 'Reference',
    position: 'left',
    // activeLinkRegex: '',
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
    to: 'api',
    position: 'left',
    label: 'API',
    supabaseCustomNavBarRegex: '(^/api$|api/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_api',
  //   supabaseCustomNavBarRegex: '(^/api$|api/)',
  // },

  // CLI
  {
    to: 'cli',
    position: 'left',
    label: 'CLI',
    supabaseCustomNavBarRegex: '(^/cli$|cli/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_cli',
  //   supabaseCustomNavBarRegex: '(^/cli$|cli/)',
  // },

  // supabase-js
  {
    to: 'supabase-js',
    position: 'left',
    label: 'JavaScript Library',
    supabaseCustomNavBarRegex: '(^/supabase-js$|supabase-js/)',
  },
  {
    type: 'docsVersionDropdown',
    position: 'left',
    docsPluginId: '_supabase_js',
    supabaseCustomNavBarRegex: '(^/supabase-js$|supabase-js/)',
  },

  /**
   * TOOLS
   */

  // GoTrue
  {
    to: 'auth',
    position: 'left',
    label: 'Auth Server',
    supabaseCustomNavBarRegex: '(^/auth$|auth/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_gotrue',
  //   supabaseCustomNavBarRegex: '(^/gotrue$|gotrue/)',
  // },

  // Storage
  {
    to: 'storage',
    position: 'left',
    label: 'Storage Server',
    supabaseCustomNavBarRegex: '(^/storage$|storage/)',
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
    to: 'supabase-dart',
    position: 'left',
    label: 'Dart Library',
    supabaseCustomNavBarRegex: '(^/supabase-dart$|supabase-dart/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_supabase_dart',
  //   supabaseCustomNavBarRegex: '(^/supabase-dart$|supabase-dart/)',
  // },

  {
    to: 'auth-helpers',
    position: 'left',
    label: 'Auth Helpers',
    supabaseCustomNavBarRegex: '(^/auth-helpers$|auth-helpers/)',
  },
  // {
  //   type: 'docsVersionDropdown',
  //   position: 'left',
  //   docsPluginId: '_auth_helpers',
  //   supabaseCustomNavBarRegex: '(^/auth-helpers$|auth-helpers/)',
  // },
]

module.exports = { navbar }
