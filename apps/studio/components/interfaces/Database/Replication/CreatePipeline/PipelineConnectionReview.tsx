import { useWatch, type Control } from 'react-hook-form'
import { Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  DEFAULT_CONNECTION_POOL_SIZE,
  DEFAULT_DUCKLAKE_POOL_SIZE,
} from '../DestinationPanel/DestinationForm/DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'

export const PipelineConnectionReview = ({
  type,
  control,
}: {
  type: DestinationType
  control: Control<DestinationPanelSchemaType>
}) => {
  const [pool, staleness, lakePool, role] = useWatch({
    control,
    name: ['connectionPoolSize', 'maxStalenessMins', 'ducklakePoolSize', 'snowflakeRole'],
  })
  const rows: { label: string; value: string; description: string }[] = []
  if (type === 'BigQuery') {
    if (typeof pool === 'number' && pool !== DEFAULT_CONNECTION_POOL_SIZE)
      rows.push({
        label: 'Connection pool size',
        value: String(pool),
        description: 'Number of BigQuery connections used for destination writes.',
      })
    if (typeof staleness === 'number')
      rows.push({
        label: 'Maximum staleness',
        value: `${staleness} minutes`,
        description: 'Maximum age of BigQuery query results for newly created or recreated tables.',
      })
  }
  if (
    type === 'DuckLake' &&
    typeof lakePool === 'number' &&
    lakePool !== DEFAULT_DUCKLAKE_POOL_SIZE
  )
    rows.push({
      label: 'Pool size',
      value: String(lakePool),
      description: 'Maximum concurrent connections this pipeline opens to the catalog.',
    })
  if (type === 'Snowflake' && role?.trim())
    rows.push({
      label: 'Role',
      value: role,
      description: 'Snowflake role used for SQL requests.',
    })
  return (
    <>
      {rows.map(({ label, value, description }) => (
        <FormItemLayout
          key={label}
          isReactForm={false}
          layout="horizontal"
          label={label}
          description={description}
        >
          <Input readOnly aria-label={label} value={value} />
        </FormItemLayout>
      ))}
    </>
  )
}
