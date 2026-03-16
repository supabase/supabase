import pgMeta from '@supabase/pg-meta'

export const FOREIGN_KEY_CASCADE_OPTIONS = [
  { key: 'no-action', label: 'No action', value: pgMeta.tableEditor.FOREIGN_KEY_CASCADE_ACTION.NO_ACTION },
  { key: 'cascade', label: 'Cascade', value: pgMeta.tableEditor.FOREIGN_KEY_CASCADE_ACTION.CASCADE },
  { key: 'restrict', label: 'Restrict', value: pgMeta.tableEditor.FOREIGN_KEY_CASCADE_ACTION.RESTRICT },
  { key: 'set-default', label: 'Set default', value: pgMeta.tableEditor.FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT },
  { key: 'set-null', label: 'Set NULL', value: pgMeta.tableEditor.FOREIGN_KEY_CASCADE_ACTION.SET_NULL },
]
