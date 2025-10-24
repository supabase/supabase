import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { StringNumberOrNull } from 'components/ui/Forms/Form.constants'
import NoPermission from 'components/ui/NoPermission'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'

import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FormSchema = z.object({
  API_MAX_REQUEST_DURATION: z.coerce
    .number()
    .min(5, 'Must be 5 or larger')
    .max(30, 'Must be a value no greater than 30'),
  DB_MAX_POOL_SIZE: z.coerce.number().min(1),
  DB_MAX_POOL_SIZE_UNIT: z.enum(['percent', 'connections']),
})

export const PerformanceSettingsForm = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const [isUpdatingRequestDurationForm, setIsUpdatingRequestDurationForm] = useState(false)
  const [isUpdatingDatabaseForm, setIsUpdatingDatabaseForm] = useState(false)

  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isLoading: isLoadingAuthConfig,
  } = useAuthConfigQuery({ projectRef: project?.ref })

  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()

  const { data: maxConnData, isLoading: isLoadingMaxConns } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const maxConnectionLimit = maxConnData?.maxConnections

  const isLoading = isLoadingAuthConfig || isLoadingMaxConns

  const isProPlan = organization?.plan.id !== 'free' && organization?.plan.id !== 'pro'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlan

  const requestDurationForm = useForm({
    resolver: zodResolver(
      z.object({
        API_MAX_REQUEST_DURATION: FormSchema.shape.API_MAX_REQUEST_DURATION,
      })
    ),
    defaultValues: {
      API_MAX_REQUEST_DURATION: 10,
    },
  })

  const databaseForm = useForm({
    resolver: zodResolver(
      z.object({
        DB_MAX_POOL_SIZE: FormSchema.shape.DB_MAX_POOL_SIZE,
        DB_MAX_POOL_SIZE_UNIT: FormSchema.shape.DB_MAX_POOL_SIZE_UNIT,
      })
    ),
    defaultValues: {
      DB_MAX_POOL_SIZE: undefined,
      DB_MAX_POOL_SIZE_UNIT: 'connections',
    },
  })

  const chosenUnit = databaseForm.watch('DB_MAX_POOL_SIZE_UNIT')

  useEffect(() => {
    if (authConfig) {
      if (!isUpdatingRequestDurationForm) {
        requestDurationForm.reset({
          API_MAX_REQUEST_DURATION: authConfig?.API_MAX_REQUEST_DURATION ?? 10,
        })
      }

      if (!isUpdatingDatabaseForm) {
        databaseForm.reset({
          DB_MAX_POOL_SIZE:
            authConfig?.DB_MAX_POOL_SIZE !== null ? authConfig?.DB_MAX_POOL_SIZE : 10,
          DB_MAX_POOL_SIZE_UNIT:
            authConfig?.DB_MAX_POOL_SIZE_UNIT !== null
              ? authConfig?.DB_MAX_POOL_SIZE_UNIT
              : 'connections',
        })
      }
    }
  }, [authConfig, isUpdatingRequestDurationForm, isUpdatingDatabaseForm])

  const onSubmitRequestDurationForm = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!isProPlan) return

    setIsUpdatingRequestDurationForm(true)

    updateAuthConfig(
      { projectRef: projectRef, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update request duration settings: ${error?.message}`)
          setIsUpdatingRequestDurationForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated request duration settings')
          setIsUpdatingRequestDurationForm(false)
        },
      }
    )
  }

  const onSubmitDatabaseForm = (values: any) => {
    if (!project?.ref) return console.error('Project ref is required')

    setIsUpdatingDatabaseForm(true)

    const config = {
      DB_MAX_POOL_SIZE: values.DB_MAX_POOL_SIZE,
      DB_MAX_POOL_SIZE_UNIT: values.DB_MAX_POOL_SIZE_UNIT,
    }

    updateAuthConfig(
      { projectRef: project?.ref, config },
      {
        onError: (error) => {
          setIsUpdatingDatabaseForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated database connection settings')
          setIsUpdatingDatabaseForm(false)
        },
      }
    )
  }

  if (isError) {
    return (
      <ScaffoldSection isFullWidth>
        <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
      </ScaffoldSection>
    )
  }

  if (!canReadConfig) {
    return (
      <ScaffoldSection isFullWidth>
        <NoPermission resourceText="view auth configuration settings" />
      </ScaffoldSection>
    )
  }

  if (isLoading) {
    return (
      <ScaffoldSection isFullWidth>
        <GenericSkeletonLoader />
      </ScaffoldSection>
    )
  }

  return (
    <>
      {promptProPlanUpgrade && (
        <div className="my-4">
          <UpgradeToPro
            primaryText="Upgrade to Pro"
            secondaryText="Adjusting low-level Auth settings is only available on the Pro plan or higher."
            buttonText="Upgrade to Pro"
          />
        </div>
      )}
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Request Duration</ScaffoldSectionTitle>

        <Form_Shadcn_ {...requestDurationForm}>
          <form
            onSubmit={requestDurationForm.handleSubmit(onSubmitRequestDurationForm)}
            className="space-y-4"
          >
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={requestDurationForm.control}
                  name="API_MAX_REQUEST_DURATION"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Terminate long-running requests"
                      description="Requests that have not completed within this timeframe will be terminated. Adjust this value to control load-shedding. Recommended: not less than 10 seconds."
                    >
                      <FormControl_Shadcn_>
                        <div className="relative">
                          <PrePostTab postTab="seconds">
                            <Input_Shadcn_
                              type="number"
                              min={5}
                              max={30}
                              {...field}
                              disabled={!canUpdateConfig || promptProPlanUpgrade}
                            />
                          </PrePostTab>
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {requestDurationForm.formState.isDirty && (
                  <Button type="default" onClick={() => requestDurationForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig ||
                    isUpdatingRequestDurationForm ||
                    !requestDurationForm.formState.isDirty ||
                    promptProPlanUpgrade
                  }
                  loading={isUpdatingRequestDurationForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Connection Management</ScaffoldSectionTitle>

        <Form_Shadcn_ {...databaseForm}>
          <form onSubmit={databaseForm.handleSubmit(onSubmitDatabaseForm)} className="space-y-4">
            <Card>
              <CardContent className="pt-6 flex flex-col gap-4">
                <FormField_Shadcn_
                  control={databaseForm.control}
                  name="DB_MAX_POOL_SIZE_UNIT"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Allocation strategy"
                      description="Choose to allocate a percentage or an absolute number of connections to the Auth server. Prefer a percentage strategy as it grows with your instance size."
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={(value) => {
                            const values = databaseForm.getValues()

                            field.onChange(value)

                            if (values.DB_MAX_POOL_SIZE_UNIT !== value) {
                              let preservedPoolSize

                              if (value === 'percent') {
                                // convert from absolute number to roughly the same percentage
                                preservedPoolSize = Math.ceil(
                                  (Math.min(maxConnectionLimit, values.DB_MAX_POOL_SIZE) /
                                    maxConnectionLimit) *
                                    100
                                )
                              } else {
                                // convert from percentage to roughly the same connection number
                                preservedPoolSize = Math.floor(
                                  maxConnectionLimit *
                                    (Math.min(100, values.DB_MAX_POOL_SIZE) / 100)
                                )
                              }

                              databaseForm.setValue('DB_MAX_POOL_SIZE', preservedPoolSize)
                            }
                          }}
                        >
                          <SelectTrigger_Shadcn_ size="small">
                            <SelectValue_Shadcn_>
                              {field.value === 'percent' ? 'Percentage' : 'Absolute'}
                            </SelectValue_Shadcn_>
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectItem_Shadcn_ value="connections" className="text-xs">
                              Absolute number of connections
                            </SelectItem_Shadcn_>
                            <SelectItem_Shadcn_ value="percent" className="text-xs">
                              Percent of max connections
                            </SelectItem_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  control={databaseForm.control}
                  name="DB_MAX_POOL_SIZE"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Maximum connections"
                      description={
                        <>
                          Limit the maximum number of connections that the Auth server will take up
                          under highest load.{' '}
                          <em className="text-brand !not-italic">Connections are not reserved</em>{' '}
                          and returned to Postgres a few minutes after being idle.
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <div className="flex flex-col gap-2">
                          <div className="relative">
                            <PrePostTab postTab={chosenUnit === 'percent' ? '%' : 'connections'}>
                              <Input_Shadcn_
                                className="w-20"
                                type="number"
                                {...field}
                                min={3}
                                max={
                                  chosenUnit === 'percent'
                                    ? 80
                                    : Math.floor(maxConnectionLimit * 0.8)
                                }
                                disabled={!canUpdateConfig || promptProPlanUpgrade}
                              />
                            </PrePostTab>
                          </div>
                          <div className="px-2 text-xs text-muted w-full text-end">
                            <span className="text-brand">
                              {chosenUnit === 'percent'
                                ? Math.floor(
                                    maxConnectionLimit * (Math.min(100, field.value) / 100)
                                  ).toString()
                                : Math.min(maxConnectionLimit, field.value)}
                            </span>{' '}
                            / {maxConnectionLimit} max
                          </div>
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {databaseForm.formState.isDirty && (
                  <Button type="default" onClick={() => databaseForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig || isUpdatingDatabaseForm || !databaseForm.formState.isDirty
                  }
                  loading={isUpdatingDatabaseForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>
    </>
  )
}
