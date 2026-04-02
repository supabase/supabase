import { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  SheetSection,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { QUEUE_TYPES } from '../Queues.constants'
import { usePgPartmanStatus } from '../usePgPartmanStatus'
import { CreateQueueForm } from './CreateQueueSheet.schema'

export function QueueTypeSelector({ form }: { form: UseFormReturn<CreateQueueForm> }) {
  const { isInstalled } = usePgPartmanStatus()

  return (
    <SheetSection>
      <FormField_Shadcn_
        control={form.control}
        name="values.type"
        render={({ field }) => (
          <FormItemLayout label="Type" layout="vertical" className="gap-1">
            <FormControl_Shadcn_>
              <RadioGroupStacked
                id="queue_type"
                name="queue_type"
                value={field.value}
                disabled={field.disabled}
                onValueChange={field.onChange}
              >
                {QUEUE_TYPES.filter(
                  (definition) => definition.value !== 'partitioned' || isInstalled
                ).map((definition) => {
                  const isPartitioned = definition.value === 'partitioned'

                  return (
                    <RadioGroupStackedItem
                      key={definition.value}
                      id={definition.value}
                      value={definition.value}
                      label=""
                      showIndicator={false}
                    >
                      <div className="flex items-start gap-x-5">
                        <div className="text-foreground">{definition.icon}</div>
                        <div className="flex flex-col gap-y-1">
                          <div className="flex items-center gap-x-2">
                            <p className="text-foreground text-left">{definition.label}</p>
                            {isPartitioned && <Badge variant="success">Recommended</Badge>}
                          </div>
                          <p className="text-foreground-lighter text-left">
                            {isPartitioned
                              ? 'Automatically manages data retention and improves performance for high-volume queues via pg_partman.'
                              : definition.description}
                          </p>
                        </div>
                      </div>
                    </RadioGroupStackedItem>
                  )
                })}
              </RadioGroupStacked>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </SheetSection>
  )
}
