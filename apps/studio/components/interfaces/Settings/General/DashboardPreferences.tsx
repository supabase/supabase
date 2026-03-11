import { zodResolver } from '@hookform/resolvers/zod'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import ShimmeringLoader, { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const formSchema = z.object({
  defaultDatabase: z.string().optional(),
})

export type DashboardPreference = z.infer<typeof formSchema>

const DEFAULT_PREFERENCE: DashboardPreference = {
  defaultDatabase: undefined,
}

export const DashboardPreferences = () => {
  const { ref: projectRef } = useParams()

  const [dashboardPreferences, setDashboardPreferences, { isLoading }] =
    useLocalStorageQuery<DashboardPreference>(
      LOCAL_STORAGE_KEYS.DASHBOARD_PREFERENCES(projectRef ?? '_'),
      DEFAULT_PREFERENCE
    )

  const { isPending } = useReadReplicasQuery({ projectRef })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: dashboardPreferences,
    values: dashboardPreferences,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const onSubmit = async (values: DashboardPreference) => {
    if (!projectRef) return console.error('Ref is required')
    setDashboardPreferences(values)
    form.reset(values)
    toast.success('Successfully saved dashboard preferences!')
  }

  return (
    <PageSection>
      <PageSectionContent>
        {isLoading ? (
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        ) : (
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="defaultDatabase"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Preferred database for dashboard queries"
                        description="For dashboard features like the Table Editor"
                        className="[&>div]:md:w-1/2"
                      >
                        {isPending ? (
                          <ShimmeringLoader />
                        ) : (
                          <FormControl_Shadcn_>
                            {/* [Joshen] Need to disable unhealthy replicas */}
                            <DatabaseSelector
                              isForm
                              buttonProps={{ size: 'small', className: 'w-full' }}
                              selectedDatabaseId={field.value ?? projectRef}
                              onSelectId={(id) =>
                                field.onChange(id === projectRef ? undefined : id)
                              }
                            />
                          </FormControl_Shadcn_>
                        )}
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button
                      type="default"
                      htmlType="button"
                      onClick={() => form.reset(dashboardPreferences)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="primary" htmlType="submit" disabled={!form.formState.isDirty}>
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
