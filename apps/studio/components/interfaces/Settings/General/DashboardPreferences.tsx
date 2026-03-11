import { zodResolver } from '@hookform/resolvers/zod'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { HelpCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import ShimmeringLoader, { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { InlineLink } from '@/components/ui/InlineLink'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const formSchema = z.object({
  defaultDatabase: z.string().optional(),
})

export type DashboardPreference = z.infer<typeof formSchema>

const DEFAULT_PREFERENCE: DashboardPreference = {
  defaultDatabase: undefined,
}

/**
 * [Joshen] JFYI am not convinced about the UX of this, will iterate over time
 * and only release to public when we're satisfied with how it behaves
 * - Where should "Dashboard preferences" live
 * - Preferences currently only apply to the user via local storage until we have middleware support that will persist the setting on the project for all users
 * - Should selecting which database to run queries for dashboard be an option for users to configure (or for us to just default to)
 *   - I'd love for this to work seamlessly, but main concern atm is latency which is region dependent
 * - Also, current database logic only applies to Table Editor atm, will need to extend it further to other pages
 */

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
      <PageSectionContent className="flex flex-col gap-y-4">
        {/* [Joshen] Ideally we're able to persist this for all users in the project, but will need support in our middleware */}
        <Admonition
          type="note"
          title="Preferences currently do not affect other members of this project"
        />

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
                        description={
                          <p>
                            All read queries from the dashboard will run against the selected
                            database by default
                            <DashboardQueriesDialog />
                          </p>
                        }
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

const DashboardQueriesDialog = () => {
  const { ref } = useParams()
  return (
    <Dialog>
      <DialogTrigger className="ml-1 translate-y-0.5">
        <HelpCircle size={14} className="hover:text-foreground transition" />
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>How does the dashboard interact with your project's database?</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-y-2">
          <p className="text-sm">
            The dashboard queries your project's database to display data across various interfaces,
            such as the <InlineLink href={`/project/${ref}/editor`}>Table Editor</InlineLink>, the{' '}
            <InlineLink href={`/project/${ref}/auth/users`}>Auth Users</InlineLink> page, and more.
          </p>

          <p className="text-sm">
            You can route these queries to a read replica instead, which will help reduce load on
            your primary database.
          </p>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild className="opacity-100">
            <Button type="default">Understood</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
