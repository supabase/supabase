import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import {
  LOG_VISIBILITY_VALUES,
  type LogVisibility,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { useLogVisibility } from '@/components/interfaces/UnifiedLogs/useLogVisibility'

const FORM_ID = 'log-visibility-form'

const FormSchema = z.object({ logVisibility: z.enum(LOG_VISIBILITY_VALUES) })
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = { logVisibility: 'all' }

const OPTIONS: { value: LogVisibility; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'Show every log' },
  {
    value: 'errors_only',
    label: 'Errors Only',
    description: 'Show Postgres errors and HTTP 4xx and 5xx responses',
  },
]

export const LogVisibilitySettings = () => {
  const { ref: projectRef } = useParams()
  const { logVisibility, setLogVisibility, isLoading } = useLogVisibility(projectRef)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    values: { logVisibility },
  })
  const { isDirty } = form.formState

  const onSubmit = (values: FormValues) => {
    setLogVisibility(values.logVisibility)
    form.reset(values)
    toast.success('Updated log visibility')
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="logs">Logs</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoading ? (
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        ) : (
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="logVisibility"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Log visibility"
                        description="Controls which logs appear in Unified Logs. Logs are still collected and stored."
                        className="[&>div]:md:w-1/2"
                      >
                        <FormControl>
                          <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                            {OPTIONS.map((option) => (
                              <RadioGroupStackedItem
                                key={option.value}
                                value={option.value}
                                label={option.label}
                                description={option.description}
                              />
                            ))}
                          </RadioGroupStacked>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  {isDirty && (
                    <Button type="button" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button form={FORM_ID} variant="primary" type="submit" disabled={!isDirty}>
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
