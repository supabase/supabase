module.exports = {
  docs: [
    {
      type: 'category',
      label: 'About',
      items: ['reference/javascript/index', 'reference/javascript/installing', 'reference/javascript/initializing', 'reference/javascript/generating-types'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Auth',
      items: ['reference/javascript/auth-signup', 'reference/javascript/auth-signin', 'reference/javascript/auth-signout', 'reference/javascript/auth-session', 'reference/javascript/auth-user', 'reference/javascript/auth-update', 'reference/javascript/auth-onauthstatechange', 'reference/javascript/reset-password-email'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Data',
      items: ['reference/javascript/select', 'reference/javascript/insert', 'reference/javascript/update', 'reference/javascript/upsert', 'reference/javascript/delete', 'reference/javascript/rpc'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Realtime',
      items: ['reference/javascript/subscribe', 'reference/javascript/removesubscription', 'reference/javascript/getsubscriptions'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Modifiers',
      items: ['reference/javascript/using-modifiers', 'reference/javascript/limit', 'reference/javascript/order', 'reference/javascript/range', 'reference/javascript/single'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Filters',
      items: ['reference/javascript/using-filters', 'reference/javascript/filter', 'reference/javascript/or', 'reference/javascript/not', 'reference/javascript/match', 'reference/javascript/eq', 'reference/javascript/neq', 'reference/javascript/gt', 'reference/javascript/gte', 'reference/javascript/lt', 'reference/javascript/lte', 'reference/javascript/like', 'reference/javascript/ilike', 'reference/javascript/is', 'reference/javascript/in', 'reference/javascript/contains', 'reference/javascript/containedby', 'reference/javascript/rangelt', 'reference/javascript/rangegt', 'reference/javascript/rangegte', 'reference/javascript/rangelte', 'reference/javascript/rangeadjacent', 'reference/javascript/overlaps', 'reference/javascript/textsearch'],
      collapsed: true,
    }
  ],
}