export const ENABLED_MODE_OPTIONS = [
  { label: 'Origin', value: 'ORIGIN', description: 'This is the default behaviour' },
  {
    label: 'Replica',
    value: 'REPLICA',
    description: 'Will only fire if the session is in “replica” mode',
  },
  {
    label: 'Always',
    value: 'ALWAYS',
    description: 'Will fire regardless of the current replication role',
  },
  { label: 'Disabled', value: 'DISABLED', description: 'Will not fire' },
]
