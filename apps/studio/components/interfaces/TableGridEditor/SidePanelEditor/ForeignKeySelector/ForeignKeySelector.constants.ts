import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'

export const FOREIGN_KEY_CASCADE_OPTIONS = [
  { key: 'no-action', label: 'No action', value: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION },
  { key: 'cascade', label: 'Cascade', value: FOREIGN_KEY_CASCADE_ACTION.CASCADE },
  { key: 'restrict', label: 'Restrict', value: FOREIGN_KEY_CASCADE_ACTION.RESTRICT },
  { key: 'set-default', label: 'Set default', value: FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT },
  { key: 'set-null', label: 'Set NULL', value: FOREIGN_KEY_CASCADE_ACTION.SET_NULL },
]
