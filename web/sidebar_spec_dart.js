module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['reference/dart/installing', 'reference/dart/initializing'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Auth',
      items: ['reference/dart/auth-signup', 'reference/dart/auth-signin', 'reference/dart/auth-signinwithprovider', 'reference/dart/auth-signout', 'reference/dart/auth-session', 'reference/dart/auth-user', 'reference/dart/auth-update', 'reference/dart/auth-onauthstatechange', 'reference/dart/reset-password-email'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Functions',
      items: ['reference/dart/invoke'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Database',
      items: ['reference/dart/select', 'reference/dart/insert', 'reference/dart/update', 'reference/dart/upsert', 'reference/dart/delete', 'reference/dart/rpc'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Realtime',
      items: ['reference/dart/subscribe', 'reference/dart/removesubscription', 'reference/dart/getsubscriptions', 'reference/dart/stream'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Storage',
      items: ['reference/dart/storage-createbucket', 'reference/dart/storage-getbucket', 'reference/dart/storage-listbuckets', 'reference/dart/storage-updatebucket', 'reference/dart/storage-deletebucket', 'reference/dart/storage-emptybucket', 'reference/dart/storage-from-upload', 'reference/dart/storage-from-download', 'reference/dart/storage-from-list', 'reference/dart/storage-from-update', 'reference/dart/storage-from-move', 'reference/dart/storage-from-remove', 'reference/dart/storage-from-createsignedurl', 'reference/dart/storage-from-getpublicurl'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['reference/dart/using-modifiers', 'reference/dart/limit', 'reference/dart/order', 'reference/dart/range', 'reference/dart/single'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['reference/dart/using-filters', 'reference/dart/or', 'reference/dart/not', 'reference/dart/match', 'reference/dart/eq', 'reference/dart/neq', 'reference/dart/gt', 'reference/dart/gte', 'reference/dart/lt', 'reference/dart/lte', 'reference/dart/like', 'reference/dart/ilike', 'reference/dart/is_', 'reference/dart/in_', 'reference/dart/contains', 'reference/dart/containedby', 'reference/dart/rangelt', 'reference/dart/rangegt', 'reference/dart/rangegte', 'reference/dart/rangelte', 'reference/dart/rangeadjacent', 'reference/dart/overlaps', 'reference/dart/textsearch', 'reference/dart/filter'],
      collapsed: true,
    }
  ],
}