import { IS_PLATFORM } from 'common'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { TableField } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableEditor.types'
import { generateTableField } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableEditor.utils'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { TableField as QuickstartTableField } from './types'
import { QUICKSTART_DEFAULT_SCHEMA } from './constants'
import { useQuickstartSnapshot, useQuickstartStore } from './quickstartStore'

interface UseQuickstartDataOptions {
  isNewRecord: boolean
  visible: boolean
}

export const useQuickstartData = ({
  isNewRecord,
  visible,
}: UseQuickstartDataOptions): TableField | null => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const quickstartSnap = useQuickstartSnapshot()
  const quickstartStore = useQuickstartStore()
  const [tableFields, setTableFields] = useState<TableField | null>(null)
  const [hasProcessedData, setHasProcessedData] = useState(false)

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (quickstartSnap.isQuickstartFlow && !visible) {
      tableEditorSnap.onAddTable()
    }
  }, [quickstartSnap.isQuickstartFlow, visible, tableEditorSnap])

  useEffect(() => {
    if (!visible && hasProcessedData) {
      quickstartStore.clearQuickstartData()
      setHasProcessedData(false)
      setTableFields(null)
    }
  }, [visible, hasProcessedData, quickstartStore])

  useEffect(() => {
    if (!visible || !isNewRecord) {
      return
    }

    if (quickstartSnap.selectedTableData) {
      try {
        const { tableName, fields, rationale } = quickstartSnap.selectedTableData

        if (!tableName || !Array.isArray(fields) || fields.length === 0) {
          throw new Error('Invalid quickstart data structure')
        }

        const columns: TableField['columns'] = fields.map(
          (field: QuickstartTableField, index: number) => {
            // Check if field is marked as primary or if it's an id field
            const isPrimaryKey = field.isPrimary === true || field.name === 'id'

            const looksLikeIdentity =
              field.name === 'id' &&
              field.type.toLowerCase().includes('int') &&
              !field.default

            // Don't set default value for primary keys
            const defaultValue = isPrimaryKey ? null : (field.default ? String(field.default) : null)

            return {
              id: `column-${index}`,
              name: field.name,
              format: field.type,
              defaultValue: defaultValue,
              isNullable: field.nullable !== false,
              isUnique: field.unique ?? false,
              isIdentity: looksLikeIdentity,
              isPrimaryKey: isPrimaryKey,
              comment: field.description || '',
              isNewColumn: true,
              table: tableName,
              schema: QUICKSTART_DEFAULT_SCHEMA,
              check: null,
              isArray: false,
              isEncrypted: false,
            }
          }
        )

        const tableField = {
          id: 0,
          name: tableName,
          schema: QUICKSTART_DEFAULT_SCHEMA,
          comment: rationale || '',
          columns: columns,
          isRLSEnabled: false,
          isRealtimeEnabled: false,
        } as TableField

        setTableFields(tableField)
        setHasProcessedData(true)
        quickstartStore.endQuickstartFlow()
      } catch (error) {
        console.error('Error processing quickstart data:', error)
        toast.error('Unable to load template data. Starting with default table instead.')

        const defaultTable = generateTableField()
        const defaultWithSchema = {
          ...defaultTable,
          schema: QUICKSTART_DEFAULT_SCHEMA,
        } as TableField
        setTableFields(defaultWithSchema)
        quickstartStore.clearQuickstartData()
      }
    } else if (!quickstartSnap.selectedTableData) {
      setTableFields(null)
    }
  }, [visible, isNewRecord, quickstartSnap.selectedTableData, quickstartStore])

  return tableFields
}
