import { uuidv4 } from 'lib/helpers'
import { ColumnField } from '../SidePanelEditor.types'

export const DEFAULT_COLUMNS: ColumnField[] = [
  {
    id: uuidv4(),
    name: 'id',
    format: 'int8',
    defaultValue: null,
    check: null,
    foreignKey: undefined,
    isNullable: false,
    isUnique: false,
    isArray: false,
    isPrimaryKey: true,
    isIdentity: true,
    isNewColumn: true,
    isEncrypted: false,
  },
  {
    id: uuidv4(),
    name: 'created_at',
    format: 'timestamptz',
    defaultValue: 'now()',
    check: null,
    foreignKey: undefined,
    isNullable: false,
    isUnique: false,
    isArray: false,
    isPrimaryKey: false,
    isIdentity: false,
    isNewColumn: true,
    isEncrypted: false,
  },
]
