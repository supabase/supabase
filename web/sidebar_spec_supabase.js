module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['reference/javascript/index', 'reference/javascript/installing', 'reference/javascript/initializing', 'reference/javascript/generating-types'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Auth',
      items: ['reference/javascript/auth-signup', 'reference/javascript/auth-signin', 'reference/javascript/auth-signout', 'reference/javascript/auth-session', 'reference/javascript/auth-user', 'reference/javascript/auth-update', 'reference/javascript/auth-setauth', 'reference/javascript/auth-onauthstatechange', 'reference/javascript/auth-api-getuser', 'reference/javascript/auth-api-resetpasswordforemail'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Auth (Server Only)',
      items: ['reference/javascript/auth-api-createuser', 'reference/javascript/auth-api-deleteuser', 'reference/javascript/auth-api-generatelink', 'reference/javascript/auth-api-inviteuserbyemail', 'reference/javascript/auth-api-sendmobileotp', 'reference/javascript/auth-api-updateuserbyid'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Functions',
      items: ['reference/javascript/invoke'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Database',
      items: ['reference/javascript/select', 'reference/javascript/insert', 'reference/javascript/update', 'reference/javascript/upsert', 'reference/javascript/delete', 'reference/javascript/rpc'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Realtime',
      items: ['reference/javascript/subscribe', 'reference/javascript/removesubscription', 'reference/javascript/removeallsubscriptions', 'reference/javascript/getsubscriptions'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Storage',
      items: ['reference/javascript/storage-createbucket', 'reference/javascript/storage-getbucket', 'reference/javascript/storage-listbuckets', 'reference/javascript/storage-updatebucket', 'reference/javascript/storage-deletebucket', 'reference/javascript/storage-emptybucket', 'reference/javascript/storage-from-upload', 'reference/javascript/storage-from-download', 'reference/javascript/storage-from-list', 'reference/javascript/storage-from-update', 'reference/javascript/storage-from-move', 'reference/javascript/storage-from-copy', 'reference/javascript/storage-from-remove', 'reference/javascript/storage-from-createsignedurl', 'reference/javascript/storage-from-createsignedurls', 'reference/javascript/storage-from-getpublicurl'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['reference/javascript/using-modifiers', 'reference/javascript/limit', 'reference/javascript/order', 'reference/javascript/range', 'reference/javascript/single', 'reference/javascript/maybesingle'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['reference/javascript/using-filters', 'reference/javascript/or', 'reference/javascript/not', 'reference/javascript/match', 'reference/javascript/eq', 'reference/javascript/neq', 'reference/javascript/gt', 'reference/javascript/gte', 'reference/javascript/lt', 'reference/javascript/lte', 'reference/javascript/like', 'reference/javascript/ilike', 'reference/javascript/is', 'reference/javascript/in', 'reference/javascript/contains', 'reference/javascript/containedby', 'reference/javascript/rangelt', 'reference/javascript/rangegt', 'reference/javascript/rangegte', 'reference/javascript/rangelte', 'reference/javascript/rangeadjacent', 'reference/javascript/overlaps', 'reference/javascript/textsearch', 'reference/javascript/filter'],
      collapsed: true,
    }
  ],
}