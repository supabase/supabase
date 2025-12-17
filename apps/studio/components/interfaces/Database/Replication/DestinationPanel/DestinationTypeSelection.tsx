import type { UseFormReturn } from 'react-hook-form'

import { useFlag } from 'common'
import { AnalyticsBucket, BigQuery } from 'icons'
import {
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import { Admonition } from 'ui-patterns'
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
      <div className="flex flex-col gap-y-2 mb-4">
        <p className="text-sm font-medium text-foreground">Type</p>
        {editMode && (
          <Admonition
            type="default"
            title="The destination type cannot be changed after creation"
          />
        )}
      </div>
      <FormField_Shadcn_
        name="type"
        control={form.control}
        render={({ field }) => (
          <FormControl_Shadcn_>
            <RadioGroupStacked
              disabled={editMode}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              className={cn(
                'grid grid-cols-2 [&>button>div]:py-4',
                '[&>button:first-of-type]:rounded-none [&>button:last-of-type]:rounded-none',
                '[&>button:first-of-type]:!rounded-l-lg [&>button:last-of-type]:!rounded-r-lg'
              )}
            >
              {((!editMode && etlEnableBigQuery) || (editMode && field.value === 'BigQuery')) && (
                <RadioGroupStackedItem
                  label=""
                  showIndicator={false}
                  id="BigQuery"
                  value="BigQuery"
                >
                  <div className="flex flex-col gap-y-2">
                    <BigQuery size={20} />
                    <div className="flex flex-col gap-y-0.5 text-sm text-left">
                      <p>BigQuery</p>
                      <p className="text-foreground-lighter">
                        Send data to Google Cloud's data warehouse for analytics and business
                        intelligence
                      </p>
                    </div>
                  </div>
                </RadioGroupStackedItem>
              )}
              {((!editMode && etlEnableIceberg) ||
                (editMode && field.value === 'Analytics Bucket')) && (
                <RadioGroupStackedItem
                  label=""
                  showIndicator={false}
                  id="Analytics Bucket"
                  value="Analytics Bucket"
                >
                  <div className="flex flex-col gap-y-2">
                    <AnalyticsBucket size={20} />
                    <div className="flex flex-col gap-y-0.5 text-sm text-left">
                      <p>Analytics Bucket</p>
                      <p className="text-foreground-lighter">
                        Send data to Apache Iceberg tables in your Supabase Storage for flexible
                        analytics workflows
                      </p>
                    </div>
                  </div>
                </RadioGroupStackedItem>
              )}
            </RadioGroupStacked>
          </FormControl_Shadcn_>
        )}
      />
    </div>
  )
}
