module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Postgrest Client',
      items: ['index', 'installing', 'initializing'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Query Builder',
      items: ['from', 'select', 'insert', 'update', 'delete', 'rpc'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'cs', 'cd', 'sl', 'sr', 'nxl', 'nxr', 'adj', 'ov', 'fts', 'plfts', 'phfts', 'wfts'],
      collapsed: false,
    }
  ],
}