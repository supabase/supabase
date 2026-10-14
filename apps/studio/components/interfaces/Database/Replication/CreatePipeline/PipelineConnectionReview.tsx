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
  const rows: { label: string; value: string }[] = []
  if (type === 'BigQuery') {
    if (typeof pool === 'number' && pool !== DEFAULT_CONNECTION_POOL_SIZE)
      rows.push({ label: 'Connection pool size', value: String(pool) })
    if (typeof staleness === 'number')
      rows.push({ label: 'Maximum staleness', value: `${staleness} minutes` })
  }
  if (
    type === 'DuckLake' &&
    typeof lakePool === 'number' &&
    lakePool !== DEFAULT_DUCKLAKE_POOL_SIZE
  )
    rows.push({ label: 'Pool size', value: String(lakePool) })
  if (type === 'Snowflake' && role?.trim()) rows.push({ label: 'Role', value: role })
  return (
    <>
      {rows.map(({ label, value }) => (
        <FormItemLayout key={label} isReactForm={false} layout="horizontal" label={label}>
          <Input readOnly aria-label={label} value={value} />
        </FormItemLayout>
      ))}
    </>
  )
}
