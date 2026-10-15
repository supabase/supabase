import type { Control } from 'react-hook-form'
import { FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'

export const SnowflakeConnectionFields = ({
  control,
}: {
  control: Control<DestinationPanelSchemaType>
}) => {
  return (
    <FormField
      control={control}
      name="snowflakeRole"
      render={({ field }) => (
        <FormItemLayout
          label="Role"
          labelOptional="Optional"
          layout="horizontal"
          description="Role for SQL requests. Leave blank to use the service user’s default role."
        >
          <FormControl>
            <Input {...field} placeholder="PIPELINES_ROLE" value={field.value ?? ''} />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
