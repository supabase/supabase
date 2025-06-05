export const TRIGGER_EVENTS = [
  { value: 'INSERT', label: 'Insert', description: 'Any insert operation on the table' },
  {
    value: 'UPDATE',
    label: 'Update',
    description: 'Any update operation of any column on the table',
  },
  { value: 'DELETE', label: 'Delete', description: 'Any delete operation of a record' },
]

export const TRIGGER_TYPES = [
  {
    value: 'BEFORE',
    label: 'Before the event',
    description: 'Trigger fires before the operation is attempted',
  },
  {
    value: 'AFTER',
    label: 'After the event',
    description: 'Trigger fires before the operation has completed',
  },
]

export const TRIGGER_ORIENTATIONS = [
  {
    value: 'ROW',
    label: 'Row',
    description: 'Fires once for each processed row',
  },
  {
    value: 'STATEMENT',
    label: 'Statement',
    description: 'Fires once for each statement',
  },
]

export const TRIGGER_ENABLED_MODES = [
  { value: 'ORIGIN', label: 'Origin', description: 'This is the default behaviour' },
  {
    value: 'REPLICA',
    label: 'Replica',
    description: 'Will only fire if the session is in "replica" mode',
  },
  { value: 'ALWAYS', label: 'Always', description: 'Will fire regardless of the replication role' },
  { value: 'DISABLED', label: 'Disabled', description: 'Will not fire' },
]
