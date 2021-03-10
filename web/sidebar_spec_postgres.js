module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['reference/postgres/index'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Database',
      items: ['reference/postgres/database-users', 'reference/postgres/database-passwords'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Schemas',
      items: ['reference/postgres/creating-schemas'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Tables',
      items: ['reference/postgres/creating-tables'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Columns',
      items: ['reference/postgres/creating-columns', 'reference/postgres/column-types'],
      collapsed: false,
    }
  ],
}