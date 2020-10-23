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
      items: ['auth-signup', 'auth-signin', 'auth-signout', 'auth-user', 'auth-update', 'auth-onauthstatechange', 'auth-api-resetpasswordforemail'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Reading data',
      items: ['from-select', 'from-select-limit', 'from-select-order'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Operating on data',
      items: ['from-insert', 'from-update', 'from-delete'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Stored Procedures',
      items: ['rpc'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['using-filters', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'cs', 'cd', 'sl', 'sr', 'nxl', 'nxr', 'adj', 'ov', 'fts', 'plfts', 'phfts', 'wfts'],
      collapsed: false,
    }
  ],
}