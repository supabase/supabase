import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { convertFromBytes } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import AlertError from 'components/ui/AlertError'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useRealtimeConfigurationUpdateMutation } from 'data/realtime/realtime-config-mutation'
import {
  REALTIME_DEFAULT_CONFIG,
  useRealtimeConfigurationQuery,
} from 'data/realtime/realtime-config-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
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
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const formId = 'realtime-configuration-form'

const FormSchema = z.object({
  private_only: z.boolean(),
  connection_pool: z.coerce.number().min(1).max(100),
  max_concurrent_users: z.coerce.number().min(1).max(50000),
  max_events_per_second: z.coerce.number().min(1).max(50000),
  max_bytes_per_second: z.coerce.number().min(1).max(10000000),
  max_channels_per_client: z.coerce.number().min(1).max(10000),
  max_joins_per_second: z.coerce.number().min(1).max(5000),
})

export const RealtimeSettings = () => {
  const { ref: projectRef } = useParams()
  const canUpdateConfig = useCheckPermissions(PermissionAction.REALTIME_ADMIN_READ, '*')

  const { data, error, isLoading, isSuccess, isError } = useRealtimeConfigurationQuery({
    projectRef,
  })
  const { mutate: updateRealtimeConfig, isLoading: isUpdatingConfig } =
    useRealtimeConfigurationUpdateMutation({
      onSuccess: () => {
        form.reset(form.getValues())
        toast.success('Successfully updated realtime settings')
      },
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: REALTIME_DEFAULT_CONFIG,
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (data) => {
    if (!projectRef) return console.error('Project ref is required')
    updateRealtimeConfig({ ref: projectRef, ...data })
  }

  useEffect(() => {
    // [Joshen] Temp typed with any - API typing marks all the properties as nullable,
    // but checked with Filipe that they're not supposed to
    if (data) form.reset(data as any)
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
                  name="private_only"
                  render={({ field }) => (
                    <FormSection
                      className="!p-0 !pt-2"
                      header={<FormSectionLabel>Channel restrictions</FormSectionLabel>}
                    >
                      <FormSectionContent loading={isLoading} className="!gap-y-2">
                        <FormItemLayout
                          layout="flex"
                          label="Private channels only"
                          description="If this is enabled, only private channels will be allowed"
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canUpdateConfig}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
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
                              Sets connection pool size for Realtime Authorization
                            </p>
                          }
                        >
                          Connection pool size
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
                              Sets maximum number of concurrent users rate limit
                            </p>
                          }
                        >
                          Max concurrent users
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
              </CardContent>
              <CardContent>
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
              </CardContent>
              <CardContent>
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
              </CardContent>
              <CardContent>
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
              </CardContent>
              <CardContent>
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
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                {form.formState.isDirty && (
                  <Button type="default" onClick={() => form.reset(data as any)}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!canUpdateConfig || isUpdatingConfig || !form.formState.isDirty}
                  loading={isUpdatingConfig}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}
