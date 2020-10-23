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
      items: ['sign-up', 'sign-in', 'sign-out', 'get-the-logged-in-user', 'update-the-logged-in-user', 'reset-password', 'listen-to-auth-change-events'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Reading data',
      items: ['select-data', 'limit-rows-returned', 'order-data'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Data operations',
      items: ['insert-data', 'update-rows', 'delete-rows'],
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