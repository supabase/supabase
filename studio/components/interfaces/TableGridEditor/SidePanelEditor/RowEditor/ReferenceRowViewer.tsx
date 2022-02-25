import React, { FC, useEffect, useState } from 'react'
import { Space, SidePanel, Typography, IconLoader, IconXCircle } from '@supabase/ui'
import { PostgresRelationship } from '@supabase/postgres-meta'

import ActionBar from '../ActionBar'
import InputField from './InputField'
import { RowField } from './RowEditor.types'
import { generateRowFieldsWithoutColumnMeta } from './RowEditor.utils'

interface Props {
  visible: boolean
  referenceRow?: { loading: boolean; foreignKey: any; row: any }
  closePanel: () => void
}

const ReferenceRowViewer: FC<Props> = ({ visible, referenceRow, closePanel }) => {
  const loading = referenceRow?.loading ?? true
  const foreignKey: PostgresRelationship = referenceRow?.foreignKey ?? undefined
  const row = referenceRow?.row ?? undefined
  const [rowFields, setRowFields] = useState<RowField[]>([])

  useEffect(() => {
    if (visible) {
      if (!foreignKey) {
        setRowFields([])
      } else if (row) {
        const rowFields = generateRowFieldsWithoutColumnMeta(row)
        setRowFields(rowFields)
      }
    }
  }, [visible, referenceRow])

  return (
    <SidePanel
      visible={visible}
      size="large"
      header={
        <div>
          Viewing reference row from{' '}
          <Typography.Text code>
            {foreignKey?.target_table_schema ?? ''}.{foreignKey?.target_table_name ?? ''}
          </Typography.Text>
        </div>
      }
      hideFooter={false}
      onCancel={closePanel}
      customFooter={<ActionBar backButtonLabel="Close" closePanel={closePanel} />}
    >
      <SidePanel.Content>
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-2 h-full">
            <Typography>
              <IconLoader className="animate-spin" />
            </Typography>
            <Typography.Text className="opacity-50">Loading reference row</Typography.Text>
          </div>
        ) : !row ? (
          <div className="flex flex-col items-center justify-center space-y-2 h-full">
            <Typography>
              <IconXCircle />
            </Typography>
            <Typography.Text className="opacity-50">
              Unable to find the corresponding row in {foreignKey?.target_table_schema}.
              {foreignKey?.target_table_name}
            </Typography.Text>
          </div>
        ) : (
          <div className="space-y-6">
            {rowFields.map((field: RowField) => {
              return <InputField key={field.id} field={field} isEditable={false} errors={{}} />
            })}
          </div>
        )}
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ReferenceRowViewer
