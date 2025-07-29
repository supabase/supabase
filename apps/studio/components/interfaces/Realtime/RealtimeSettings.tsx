import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { InlineLink } from 'components/ui/InlineLink'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { useRealtimeConfigurationUpdateMutation } from 'data/realtime/realtime-config-mutation'
import {
  REALTIME_DEFAULT_CONFIG,
  useRealtimeConfigurationQuery,
} from 'data/realtime/realtime-config-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const formId = 'realtime-configuration-form'

export const RealtimeSettings = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()
  const canUpdateConfig = useCheckPermissions(PermissionAction.REALTIME_ADMIN_READ, '*')

  const { data: maxConn } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data, error, isLoading, isSuccess, isError } = useRealtimeConfigurationQuery({
    projectRef,
  })

  const { data: policies } = useDatabasePoliciesQuery({
    projectRef,
    connectionString: project?.connectionString,
    schema: 'realtime',
  })

  const isUsageBillingEnabled = organization?.usage_billing_enabled

  // Check if RLS policies exist for realtime.messages table
  const realtimeMessagesPolicies = policies?.filter(
    (policy) => policy.schema === 'realtime' && policy.table === 'messages'
  )
  const hasRealtimeMessagesPolicies =
    realtimeMessagesPolicies && realtimeMessagesPolicies.length > 0

  const { mutate: updateRealtimeConfig, isLoading: isUpdatingConfig } =
    useRealtimeConfigurationUpdateMutation({
      onSuccess: () => {
        form.reset(form.getValues())
        toast.success('Successfully updated realtime settings')
      },
    })

  const FormSchema = z.object({
    connection_pool: z.coerce
      .number()
      .min(1)
      .max(maxConn?.maxConnections ?? 100),
    max_concurrent_users: z.coerce.number().min(1).max(50000),
    // [Joshen] These fields are temporarily hidden from the UI
    // max_events_per_second: z.coerce.number().min(1).max(50000),
    // max_bytes_per_second: z.coerce.number().min(1).max(10000000),
    // max_channels_per_client: z.coerce.number().min(1).max(10000),
    // max_joins_per_second: z.coerce.number().min(1).max(5000),

    allow_public: z.boolean(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ...REALTIME_DEFAULT_CONFIG,
      allow_public: !REALTIME_DEFAULT_CONFIG.private_only,
    },
  })

  const { allow_public } = form.watch()
  const isSettingToPrivate = !data?.private_only && !allow_public

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (data) => {
    if (!projectRef) return console.error('Project ref is required')
    updateRealtimeConfig({
      ref: projectRef,
      private_only: !data.allow_public,
      connection_pool: data.connection_pool,
      max_concurrent_users: data.max_concurrent_users,
    })
  }

  useEffect(() => {
    // [Joshen] Temp typed with any - API typing marks all the properties as nullable,
    // but checked with Filipe that they're not supposed to
    if (isSuccess) {
      form.reset({ ...data, allow_public: !data.private_only } as any)
    }
  }, [isSuccess])

  return (
    <ScaffoldSection isFullWidth>
      <Form_Shadcn_ {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          {isError ? (
            <AlertError error={error} subject="Failed to retrieve realtime settings" />
          ) : (
            <Card>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="allow_public"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !pt-2"
                      header={<FormSectionLabel>Channel restrictions</FormSectionLabel>}
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormItemLayout
                          layout="flex"
                          label="Allow public access"
                          description="If disabled, only private channels will be allowed"
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canUpdateConfig}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>

                        {!hasRealtimeMessagesPolicies && !allow_public && (
                          <Admonition
                            showIcon={false}
                            type="warning"
                            title="No Realtime RLS policies found"
                            description={
                              <>
                                <p className="prose max-w-full text-sm">
                                  Private mode is {isSettingToPrivate ? 'being ' : ''}
                                  enabled, but no RLS policies exists on the{' '}
                                  <code className="text-xs">realtime.messages</code> table. No
                                  messages will be received by users.
                                </p>

                                <Button asChild type="default" className="mt-2">
                                  <Link href={`/project/${projectRef}/realtime/policies`}>
                                    Create policy
                                  </Link>
                                </Button>
                              </>
                            }
                          />
                        )}
                      </FormSectionContent>
                    </FormSection>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="connection_pool"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !py-2"
                      header={
                        <FormSectionLabel
                          description={
                            <p className="text-foreground-lighter text-sm !mt-1">
                              Realtime Authorization uses this database pool to check client access
                            </p>
                          }
                        >
                          Database connection pool size
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            disabled={!canUpdateConfig}
                            value={field.value || ''}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                        {!!maxConn && field.value > maxConn.maxConnections * 0.5 && (
                          <Admonition
                            showIcon={false}
                            type="warning"
                            title={`Pool size is greater than 50% of the max connections (${maxConn.maxConnections}) on your database`}
                            description="This may result in instability and unreliability with your database connections."
                          />
                        )}
                      </FormSectionContent>
                    </FormSection>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="max_concurrent_users"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !py-2"
                      header={
                        <FormSectionLabel
                          description={
                            <p className="text-foreground-lighter text-sm !mt-1">
                              Sets maximum number of concurrent clients that can connect to your
                              Realtime service
                            </p>
                          }
                        >
                          Max concurrent clients
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            disabled={!isUsageBillingEnabled || !canUpdateConfig}
                            value={field.value || ''}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                        {!isUsageBillingEnabled && (
                          <Admonition
                            showIcon={false}
                            type="default"
                            title="Spend cap needs to be disabled to configure this value"
                            description={
                              <>
                                You may adjust this setting in the{' '}
                                <InlineLink
                                  href={`/org/${organization?.slug}/billing?panel=costControl`}
                                >
                                  organization billing settings
                                </InlineLink>
                              </>
                            }
                          />
                        )}
                      </FormSectionContent>
                    </FormSection>
                  )}
                />
              </CardContent>

              {/*
                [Joshen] The following fields are hidden from the UI temporarily while we figure out what settings to expose to the users
                - Max events per second
                - Max bytes per second
                - Max channels per client
                - Max joins per second
              */}

              {/* <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="max_events_per_second"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !py-2"
                      header={
                        <FormSectionLabel
                          description={
                            <p className="text-foreground-lighter text-sm !mt-1">
                              Sets maximum number of events per second rate per channel limit
                            </p>
                          }
                        >
                          Max events per second
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            disabled={!canUpdateConfig}
                            value={field.value || ''}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormSectionContent>
                    </FormSection>
                  )}
                />
              </CardContent> */}
              {/* <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="max_bytes_per_second"
                  render={({ field }) => {
                    const { value, unit } = convertFromBytes(field.value ?? 0)
                    return (
                      <FormSection
                        className="!p-0 !py-2"
                        header={
                          <FormSectionLabel
                            description={
                              <p className="text-foreground-lighter text-sm !mt-1">
                                Sets maximum number of bytes per second rate per channel limit
                              </p>
                            }
                          >
                            Max bytes per second
                          </FormSectionLabel>
                        }
                      >
                        <FormSectionContent loading={isLoading} className="!gap-y-2">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              type="number"
                              disabled={!canUpdateConfig}
                              value={field.value || ''}
                              {...form.register('max_bytes_per_second', { valueAsNumber: true })}
                            />
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                          {!!field.value ? (
                            <span className="text-sm text-foreground-lighter">
                              This is equivalent to {value.toFixed(2)} {unit}
                            </span>
                          ) : null}
                        </FormSectionContent>
                      </FormSection>
                    )
                  }}
                />
              </CardContent> */}
              {/* <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="max_channels_per_client"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !py-2"
                      header={
                        <FormSectionLabel
                          description={
                            <p className="text-foreground-lighter text-sm !mt-1">
                              Sets maximum number of channels per client rate limit
                            </p>
                          }
                        >
                          Max channels per client
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            disabled={!canUpdateConfig}
                            value={field.value || ''}
                            {...form.register('max_channels_per_client', { valueAsNumber: true })}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormSectionContent>
                    </FormSection>
                  )}
                />
              </CardContent> */}
              {/* <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="max_joins_per_second"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !py-2"
                      header={
                        <FormSectionLabel
                          description={
                            <p className="text-foreground-lighter text-sm !mt-1">
                              Sets maximum number of joins per second rate limit
                            </p>
                          }
                        >
                          Max joins per second
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            disabled={!canUpdateConfig}
                            value={field.value || ''}
                            {...form.register('max_joins_per_second', { valueAsNumber: true })}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormSectionContent>
                    </FormSection>
                  )}
                />
              </CardContent> */}
              <CardFooter className="justify-between">
                <div>
                  {!canUpdateConfig && (
                    <p className="text-sm text-foreground-light">
                      You need additional permissions to update realtime settings
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-x-2">
                  {form.formState.isDirty && (
                    <Button type="default" onClick={() => form.reset(data as any)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    form={formId}
                    disabled={!canUpdateConfig || isUpdatingConfig || !form.formState.isDirty}
                    loading={isUpdatingConfig}
                  >
                    Save changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </form>
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}
