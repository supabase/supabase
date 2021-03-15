module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['postgrest/client/index', 'postgrest/client/installing', 'postgrest/client/initializing'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Query Builder',
      items: ['postgrest/client/from', 'postgrest/client/select', 'postgrest/client/insert', 'postgrest/client/update', 'postgrest/client/delete', 'postgrest/client/rpc'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['postgrest/client/filter', 'postgrest/client/not', 'postgrest/client/eq', 'postgrest/client/neq', 'postgrest/client/gt', 'postgrest/client/gte', 'postgrest/client/lt', 'postgrest/client/lte', 'postgrest/client/like', 'postgrest/client/ilike', 'postgrest/client/is', 'postgrest/client/in', 'postgrest/client/cs', 'postgrest/client/cd', 'postgrest/client/sl', 'postgrest/client/sr', 'postgrest/client/nxl', 'postgrest/client/nxr', 'postgrest/client/adj', 'postgrest/client/ov', 'postgrest/client/fts', 'postgrest/client/plfts', 'postgrest/client/phfts', 'postgrest/client/wfts'],
      collapsed: true,
    }
  ],
}