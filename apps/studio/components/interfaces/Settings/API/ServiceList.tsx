import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { FormActions } from 'components/ui/Forms/FormActions'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Switch,
  WarningIcon,
} from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { PostgrestConfig } from './PostgrestConfig'

const getDefaultSchemas = (dbSchema: string | null | undefined) => {
  const schemas =
    dbSchema
      ?.split(',')
      .map((schema) => schema.trim())
      .filter((schema) => schema.length > 0) ?? []

  return schemas.length > 0 ? schemas : ['public']
}

const dataApiFormSchema = z.object({
  enableDataApi: z.boolean(),
})

export const DataApiEnableSwitch = () => {
  const { ref: projectRef } = useParams()
  const { can: canUpdatePostgrestConfig, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'custom_config_postgrest')

  const {
    data: config,
    isError,
    isPending: isLoadingConfig,
  } = useProjectPostgrestConfigQuery({ projectRef })

  const { mutate: updatePostgrestConfig, isPending: isUpdating } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: (_data, variables) => {
        toast.success(variables.dbSchema ? 'Data API enabled' : 'Data API disabled')
      },
    })

  const formId = 'data-api-enable-form'
  const isLoading = isLoadingConfig || !projectRef
  const isEnabled = !!config?.db_schema?.trim()

  const form = useForm<z.infer<typeof dataApiFormSchema>>({
    resolver: zodResolver(dataApiFormSchema),
    mode: 'onChange',
    defaultValues: {
      enableDataApi: false,
    },
  })

  useEffect(() => {
    if (!isLoading && config) {
      form.reset({ enableDataApi: isEnabled })
    }
  }, [config, form, isEnabled, isLoading])

  const onSubmit = ({ enableDataApi }: z.infer<typeof dataApiFormSchema>) => {
    if (!projectRef || !config) return

    const dbSchema = enableDataApi ? getDefaultSchemas(config.db_schema).join(', ') : ''

    updatePostgrestConfig({
      projectRef,
      dbSchema,
      maxRows: config.max_rows,
      dbExtraSearchPath: config.db_extra_search_path ?? '',
      dbPool: config.db_pool ?? null,
    })
  }

  const handleReset = () => {
    if (!config) return
    form.reset({ enableDataApi: isEnabled })
  }

  const watchedEnabled = form.watch('enableDataApi')

  return (
    <Card>
      {isLoading ? (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <ShimmeringLoader className="py-3.5" />
            <ShimmeringLoader className="py-3.5 w-3/4" delayIndex={1} />
          </div>
        </CardContent>
      ) : isError || !config ? (
        <CardContent>
          <Alert_Shadcn_ variant="destructive">
            <AlertCircle size={16} />
            <AlertTitle_Shadcn_>Failed to retrieve Data API settings</AlertTitle_Shadcn_>
          </Alert_Shadcn_>
        </CardContent>
      ) : (
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="enableDataApi"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="space-y-4">
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Enable Data API"
                      description="When enabled you will be able to use any Supabase client library and PostgREST endpoints with any schema configured in the Settings tab."
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          size="large"
                          disabled={!canUpdatePostgrestConfig || isUpdating}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>

                    {!watchedEnabled && (
                      <Alert_Shadcn_ variant="warning">
                        <WarningIcon />
                        <AlertTitle_Shadcn_>No schemas can be queried</AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          <p>
                            With this setting disabled, you will not be able to query any schemas
                            via the Data API.
                          </p>
                          <p>
                            You will see errors from the Postgrest endpoint
                            <code className="text-code-inline">/rest/v1/</code>.
                          </p>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    )}
                  </FormItem_Shadcn_>
                )}
              />
            </CardContent>
            <CardFooter>
              <FormActions
                form={formId}
                isSubmitting={isUpdating}
                hasChanges={form.formState.isDirty}
                handleReset={handleReset}
                disabled={!canUpdatePostgrestConfig}
                helper={
                  isPermissionsLoaded && !canUpdatePostgrestConfig
                    ? "You need additional permissions to update your project's API settings"
                    : undefined
                }
              />
            </CardFooter>
          </form>
        </Form_Shadcn_>
      )}
    </Card>
  )
}

export const DataApiProjectUrlCard = () => {
  const { isPending: isLoading } = useSelectedProjectQuery()
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const [querySource, setQuerySource] = useQueryState('source', parseAsString)

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const {
    data: databases,
    isError,
    isPending: isLoadingDatabases,
  } = useReadReplicasQuery({ projectRef })
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef })

  useEffect(() => {
    if (querySource && querySource !== state.selectedDatabaseId) {
      state.setSelectedDatabaseId(querySource)
    }
  }, [querySource, state, projectRef])

  // Get the API service
  const isCustomDomainActive = customDomainData?.customDomain?.status === 'active'
  const selectedDatabase = databases?.find((db) => db.identifier === state.selectedDatabaseId)
  const loadBalancerSelected = state.selectedDatabaseId === 'load-balancer'
  const replicaSelected = selectedDatabase?.identifier !== projectRef

  const endpoint =
    isCustomDomainActive && state.selectedDatabaseId === projectRef
      ? `https://${customDomainData.customDomain.hostname}`
      : loadBalancerSelected
        ? loadBalancers?.[0].endpoint ?? ''
        : selectedDatabase?.restUrl

  return (
    <PageSection className="first:pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>API URL</PageSectionTitle>
          <PageSectionDescription>
            {loadBalancerSelected
              ? 'RESTful endpoint for querying and managing your databases through your load balancer'
              : replicaSelected
                ? 'RESTful endpoint for querying your read replica'
                : 'RESTful endpoint for querying and managing your database'}
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <DatabaseSelector
            additionalOptions={
              (loadBalancers ?? []).length > 0
                ? [{ id: 'load-balancer', name: 'API Load Balancer' }]
                : []
            }
            onSelectId={() => {
              setQuerySource(null)
            }}
          />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoading || isLoadingDatabases ? (
          <div className="space-y-2">
            <ShimmeringLoader className="py-3.5" />
            <ShimmeringLoader className="py-3.5 w-3/4" delayIndex={1} />
          </div>
        ) : isError ? (
          <Alert_Shadcn_ variant="destructive">
            <AlertCircle size={16} />
            <AlertTitle_Shadcn_>Failed to retrieve project URL</AlertTitle_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <Input copy readOnly className="font-mono" value={endpoint} />
        )}
      </PageSectionContent>
    </PageSection>
  )
}

export const ServiceList = () => {
  const { data: project, isPending: isLoading } = useSelectedProjectQuery()

  return (
    <ScaffoldSection isFullWidth id="api-settings" className="gap-6">
      {!isLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle size={16} />
          <AlertTitle_Shadcn_>
            API settings are unavailable as the project is not active
          </AlertTitle_Shadcn_>
        </Alert_Shadcn_>
      ) : (
        <PostgrestConfig />
      )}
    </ScaffoldSection>
  )
}
