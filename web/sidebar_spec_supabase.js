module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['client/index', 'client/installing', 'client/initializing', 'client/generating-types'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Auth',
      items: ['client/auth-signup', 'client/auth-signin', 'client/auth-signout', 'client/auth-session', 'client/auth-user', 'client/auth-update', 'client/auth-onauthstatechange', 'client/reset-password-email'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Data',
      items: ['client/select', 'client/insert', 'client/update', 'client/delete', 'client/rpc'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Realtime',
      items: ['client/subscribe', 'client/removesubscription', 'client/getsubscriptions'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['client/using-modifiers', 'client/limit', 'client/order', 'client/range', 'client/single'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['client/using-filters', 'client/filter', 'client/or', 'client/not', 'client/match', 'client/eq', 'client/neq', 'client/gt', 'client/gte', 'client/lt', 'client/lte', 'client/like', 'client/ilike', 'client/is', 'client/in', 'client/cs', 'client/cd', 'client/sl', 'client/sr', 'client/nxl', 'client/nxr', 'client/adj', 'client/ov', 'client/fts', 'client/plfts', 'client/phfts', 'client/wfts'],
      collapsed: true,
    }
  ],
}