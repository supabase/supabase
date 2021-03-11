module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['reference/postgres/index'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Database',
      items: ['reference/postgres/database-users', 'reference/postgres/database-passwords'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Schemas',
      items: ['reference/postgres/creating-schemas'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Tables',
      items: ['reference/postgres/creating-tables'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Columns',
      items: ['reference/postgres/creating-columns', 'reference/postgres/column-types'],
      collapsed: true,
    }
  ],
}