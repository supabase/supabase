module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['client/index', 'client/installing', 'client/initializing', 'client/generating-types'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Auth',
      items: ['client/auth-signup', 'client/auth-signin', 'client/auth-signout', 'client/auth-session', 'client/auth-user', 'client/auth-update', 'client/auth-onauthstatechange', 'client/auth-resetpasswordforemail'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Data',
      items: ['client/select', 'client/insert', 'client/update', 'client/delete', 'client/rpc'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Realtime',
      items: ['client/subscribe', 'client/removesubscription', 'client/getsubscriptions'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['client/using-modifiers', 'client/limit', 'client/order', 'client/range', 'client/single'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['client/using-filters', 'client/filter', 'client/or', 'client/not', 'client/match', 'client/eq', 'client/neq', 'client/gt', 'client/gte', 'client/lt', 'client/lte', 'client/like', 'client/ilike', 'client/is', 'client/in', 'client/cs', 'client/cd', 'client/sl', 'client/sr', 'client/nxl', 'client/nxr', 'client/adj', 'client/ov', 'client/fts', 'client/plfts', 'client/phfts', 'client/wfts'],
      collapsed: false,
    }
  ],
}