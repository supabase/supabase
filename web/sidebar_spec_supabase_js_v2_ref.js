module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Auth',
      items: ['sdk/auth-signup', 'sdk/auth-signin', 'sdk/auth-signout', 'sdk/auth-session', 'sdk/auth-user', 'sdk/auth-update', 'sdk/auth-setauth', 'sdk/auth-onauthstatechange', 'sdk/auth-api-getuser', 'sdk/auth-api-resetpasswordforemail'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Auth (Server Only)',
      items: ['sdk/auth-api-listusers', 'sdk/auth-api-createuser', 'sdk/auth-api-deleteuser', 'sdk/auth-api-generatelink', 'sdk/auth-api-inviteuserbyemail', 'sdk/auth-api-sendmobileotp', 'sdk/auth-api-updateuserbyid'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Functions',
      items: ['sdk/invoke'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Database',
      items: ['sdk/select', 'sdk/insert', 'sdk/update', 'sdk/upsert', 'sdk/delete', 'sdk/rpc'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Realtime',
      items: ['sdk/subscribe', 'sdk/removesubscription', 'sdk/removeallsubscriptions', 'sdk/getsubscriptions'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Storage',
      items: ['sdk/storage-createbucket', 'sdk/storage-getbucket', 'sdk/storage-listbuckets', 'sdk/storage-updatebucket', 'sdk/storage-deletebucket', 'sdk/storage-emptybucket', 'sdk/storage-from-upload', 'sdk/storage-from-download', 'sdk/storage-from-list', 'sdk/storage-from-update', 'sdk/storage-from-move', 'sdk/storage-from-copy', 'sdk/storage-from-remove', 'sdk/storage-from-createsignedurl', 'sdk/storage-from-createsignedurls', 'sdk/storage-from-getpublicurl'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['sdk/using-modifiers', 'sdk/limit', 'sdk/order', 'sdk/range', 'sdk/single', 'sdk/maybesingle'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['sdk/using-filters', 'sdk/or', 'sdk/not', 'sdk/match', 'sdk/eq', 'sdk/neq', 'sdk/gt', 'sdk/gte', 'sdk/lt', 'sdk/lte', 'sdk/like', 'sdk/ilike', 'sdk/is', 'sdk/in', 'sdk/contains', 'sdk/containedby', 'sdk/rangelt', 'sdk/rangegt', 'sdk/rangegte', 'sdk/rangelte', 'sdk/rangeadjacent', 'sdk/overlaps', 'sdk/textsearch', 'sdk/filter'],
      collapsed: true,
    }
  ],
}