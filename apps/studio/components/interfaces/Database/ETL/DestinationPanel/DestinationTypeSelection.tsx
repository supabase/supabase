import type { UseFormReturn } from 'react-hook-form'

import { useFlag } from 'common'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import type { DestinationPanelSchemaType } from './DestinationPanel.schema'

type DestinationTypeSelectionProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}

export const DestinationTypeSelection = ({ form, editMode }: DestinationTypeSelectionProps) => {
  const etlEnableBigQuery = useFlag('etlEnableBigQuery')
  const etlEnableIceberg = useFlag('etlEnableIceberg')

  return (
    <div className="px-5 py-5">
      <p className="text-sm font-medium text-foreground mb-1">Destination type</p>
      {editMode ? (
        <p className="text-sm text-foreground-light mb-4">
          The destination type cannot be changed after creation
        </p>
      ) : (
        <p className="text-sm text-foreground-light mb-4">
          Choose which platform to send your database changes to
        </p>
      )}
      <FormField_Shadcn_
        name="type"
        control={form.control}
        render={({ field }) => (
          <FormControl_Shadcn_>
            <RadioGroupStacked
              disabled={editMode}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
            >
              {((!editMode && etlEnableBigQuery) || (editMode && field.value === 'BigQuery')) && (
                <RadioGroupStackedItem
                  id="BigQuery"
                  value="BigQuery"
                  label="BigQuery"
                  className="[&>div>div>p]:text-left"
                  description="Send data to Google Cloud's data warehouse for analytics and business intelligence"
                />
              )}
              {((!editMode && etlEnableIceberg) ||
                (editMode && field.value === 'Analytics Bucket')) && (
                <RadioGroupStackedItem
                  value="Analytics Bucket"
                  id="Analytics Bucket"
                  label="Analytics Bucket"
                  className="[&>div>div>p]:text-left"
                  description="Send data to Apache Iceberg tables in your Supabase Storage for flexible analytics workflows"
                />
              )}
            </RadioGroupStacked>
          </FormControl_Shadcn_>
        )}
      />
    </div>
  )
}
