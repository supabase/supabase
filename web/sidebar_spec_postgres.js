module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['reference/postgres/index', 'reference/postgres/connection-strings'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Managing Tables',
      items: ['reference/postgres/schemas', 'reference/postgres/tables'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Replication',
      items: ['reference/postgres/publications'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Database Configuration',
      items: ['reference/postgres/database-passwords', 'reference/postgres/changing-timezones'],
      collapsed: true,
    }
  ],
}