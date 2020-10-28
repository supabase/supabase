module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Supabase Client',
      items: ['index', 'installing', 'initializing'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Auth',
      items: ['auth-signup', 'auth-signin', 'auth-signout', 'auth-user', 'auth-update', 'auth-forgotpassword', 'auth-onauthstatechange'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Operators',
      items: ['select', 'insert', 'update', 'delete', 'rpc', 'on'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['using-modifiers', 'limit', 'order'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['using-filters', 'match', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'cs', 'cd', 'sl', 'sr', 'nxl', 'nxr', 'adj', 'ov', 'fts', 'plfts', 'phfts', 'wfts'],
      collapsed: false,
    }
  ],
}