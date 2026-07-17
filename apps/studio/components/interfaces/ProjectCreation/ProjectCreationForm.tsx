import { zodResolver } from '@hookform/resolvers/zod'
import { acceptUntrustedSql, joinSqlFragments, untrustedSql } from '@supabase/pg-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFeatureFlags, useFlag, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFormState } from 'react-hook-form'
import { type CloudProvider } from 'shared-data'
import { toast } from 'sonner'
import { Button, Form, useWatch } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { z } from 'zod'

import { AdvancedConfiguration } from './AdvancedConfiguration'
import { ComputeSizeSelector } from './ComputeSizeSelector'
import { DatabasePasswordInput } from './DatabasePasswordInput'
import { DataSeeding } from './DataSeeding'
import { DisabledWarningDueToIncident } from './DisabledWarningDueToIncident'
import { FreeProjectLimitWarning } from './FreeProjectLimitWarning'
import { InternalOnlyConfiguration } from './InternalOnlyConfiguration'
import { OrganizationSelector } from './OrganizationSelector'
import { extractPostgresVersionDetails } from './PostgresVersionSelector'
import { sizes } from './ProjectCreation.constants'
import { FormSchema } from './ProjectCreation.schema'
import {
  instanceLabel,
  monthlyInstancePrice,
  smartRegionToExactRegion,
} from './ProjectCreation.utils'
import { ProjectCreationFooter } from './ProjectCreationFooter'
import { ProjectNameInput } from './ProjectNameInput'
import { RegionSelector } from './RegionSelector'
import { SecurityOptions } from './SecurityOptions'
import { AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggers.constants'
import {
  GitHubRepositoryField,
  useGitHubRepositoryOptions,
} from '@/components/interfaces/Settings/Integrations/GithubIntegration/GitHubRepositoryField'
import Panel from '@/components/ui/Panel'
import { useAvailableOrioleImageVersion } from '@/data/config/project-creation-postgres-versions-query'
import { useOverdueInvoicesQuery } from '@/data/invoices/invoices-overdue-query'
import { useDefaultRegionQuery } from '@/data/misc/get-default-region-query'
import { useAuthorizedAppsQuery } from '@/data/oauth/authorized-apps-query'
import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
import { useOrganizationAvailableRegionsQuery } from '@/data/organizations/organization-available-regions-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { DesiredInstanceSize } from '@/data/projects/new-project.constants'
import {
  OrgProject,
  useOrgProjectsInfiniteQuery,
} from '@/data/projects/org-projects-infinite-query'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from '@/data/projects/project-create-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import {
  isInDataApiRevokeTreatment,
  useDataApiRevokeOnCreateDefaultEnabled,
} from '@/hooks/misc/useDataApiRevokeOnCreateDefault'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { DOCS_URL, PROJECT_STATUS, PROVIDERS, useDefaultProvider } from '@/lib/constants'
import { getInitialMigrationSQLFromGitHubRepo } from '@/lib/integration-utils'
import { useProfile } from '@/lib/profile'
import { trimSafeSqlFragment } from '@/lib/sql'
import { classifyApiError, classifyValidationError } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'
import { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

const sizesWithNoCostConfirmationRequired: DesiredInstanceSize[] = ['micro', 'small']

interface ProjectCreationFormProps {
  isVercelIntegrationFlow?: boolean
  onCreateSuccess?: (ref: string) => void
}

/**
 * [Joshen] JFYI am only adding the `isVercelIntegrationFlow` flag to keep the existing
 * behaviour for project creation via Vercel integration as similar to keep current state
 * for now, what it controls if `true`:
 * - Disables organization selection
 * - Hides the following:
 *  - "Internal configuration" section
 *  - "GitHub repository" field
 *  - "Free project info" at the bottom
 *  - "Cancel" button
 * - Shows the following:
 *  - "Data seeding" section
 * Eventually we could looking into reducing the differences more, e.g having data seeding
 * for both ways, and showing GitHub repository field for Vercel integration
 */
export const ProjectCreationForm = ({
  isVercelIntegrationFlow = false,
  onCreateSuccess,
}: ProjectCreationFormProps) => {
  const track = useTrack()
  const router = useRouter()
  const { profile } = useProfile()
  const { slug, projectName, externalId } = useParams()
  const trackFunnelError = useTrackFunnelError()
  const defaultProvider = useDefaultProvider()

  const surface = isVercelIntegrationFlow ? 'vercel' : 'main'

  const { data: currentOrg } = useSelectedOrganizationQuery()
  const isFreePlan = currentOrg?.plan?.id === 'free'
  const canChooseInstanceSize = !isFreePlan

  const { lastVisitedOrganization } = useLastVisitedOrganization()
  const { can: isAdmin } = useAsyncCheckPermissions(PermissionAction.CREATE, 'projects')
  const { can: canCreateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )
  const showAdvancedConfig = useIsFeatureEnabled('project_creation:show_advanced_config')
  const { hasAccess: hasAccessToGitHubIntegration } = useCheckEntitlements(
    'integrations.github_connections'
  )

  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const showInternalOnlyConfiguration =
    useFlag('newProjectInternalOnlyConfiguration') && !isVercelIntegrationFlow

  // Read the raw flag for telemetry — coerce-undefined-to-false would record false for
  // users whose flags haven't loaded yet. The raw value preserves undefined (omitted from
  // PostHog) so we only record an actual value (boolean true/false, or a variant string
  // like 'test'/'control' post-multivariate migration) once the flag has resolved.
  const dataApiRevokeOnCreateDefaultFlag = usePHFlag<boolean | string>(
    'dataApiRevokeOnCreateDefault'
  )
  const isDataApiRevokeOnCreateDefault = useDataApiRevokeOnCreateDefaultEnabled()

  const isNotOnHigherPlan = !['team', 'enterprise', 'platform'].includes(currentOrg?.plan.id ?? '')

  const [allProjects, setAllProjects] = useState<OrgProject[] | undefined>(undefined)
  const [isComputeCostsConfirmationModalVisible, setIsComputeCostsConfirmationModalVisible] =
    useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      organization: slug,
      projectName: projectName || '',
      highAvailability: false,
      postgresVersion: '',
      instanceType: '',
      cloudProvider: PROVIDERS[defaultProvider].id,
      dbPass: '',
      dbPassStrength: 0,
      dbPassStrengthMessage: '',
      dbRegion: undefined,
      githubRepositoryId: '',
      githubInstallationId: undefined,
      githubRepositoryName: '',
      instanceSize: canChooseInstanceSize ? sizes[0] : undefined,
      dataApi: true,
      dataApiDefaultPrivileges: !isDataApiRevokeOnCreateDefault,
      enableRlsEventTrigger: false,
      postgresVersionSelection: '',
      useOrioleDb: false,
      shouldRunMigrations: true,
    },
  })
  const { getFieldState, resetField, setValue } = form
  const {
    instanceSize: watchedInstanceSize,
    cloudProvider,
    dbRegion,
    githubRepositoryName,
    organization,
    projectName: watchedProjectName,
    highAvailability,
  } = useWatch({ control: form.control })
  const { dirtyFields } = useFormState(form)
  const isDbRegionDirty = dirtyFields.dbRegion
  const smartRegionEnabled = cloudProvider !== 'AWS_NIMBUS'

  // Read dirty state during render rather than depending on form.formState in the
  // effect — form.formState is a Proxy that gets a new reference every render, which
  // would re-fire this effect after each setValue and trigger an infinite loop.
  const isDataApiDefaultPrivilegesDirty = getFieldState(
    'dataApiDefaultPrivileges',
    form.formState
  ).isDirty

  // [Charis] Since the form is updated in a useEffect, there is an edge case
  // when switching from free to paid, where canChooseInstanceSize is true for
  // an in-between render, but watchedInstanceSize is still undefined from the
  // form state carried over from the free plan. To avoid this, we set a
  // default instance size in this case.
  const instanceSize = canChooseInstanceSize ? (watchedInstanceSize ?? sizes[0]) : undefined
  const { data: membersExceededLimit = [] } = useFreeProjectLimitCheckQuery(
    { slug },
    { enabled: isFreePlan }
  )
  const hasMembersExceedingFreeTierLimit = membersExceededLimit.length > 0
  const freePlanWithExceedingLimits = isFreePlan && hasMembersExceedingFreeTierLimit

  const { data: organizations = [], isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const isEmptyOrganizations = isOrganizationsSuccess && organizations.length <= 0

  const { data: approvedOAuthApps = [] } = useAuthorizedAppsQuery(
    { slug },
    { enabled: !isFreePlan && slug !== '_' }
  )
  const hasOAuthApps = approvedOAuthApps.length > 0

  const { data: allOverdueInvoices = [] } = useOverdueInvoicesQuery({
    enabled: isNotOnHigherPlan,
  })
  const overdueInvoices = allOverdueInvoices.filter((x) => x.organization_id === currentOrg?.id)
  const hasOutstandingInvoices = isNotOnHigherPlan && overdueInvoices.length > 0

  const { data: orgProjectsFromApi } = useOrgProjectsInfiniteQuery({ slug: currentOrg?.slug })
  const allOrgProjects = useMemo(
    () => orgProjectsFromApi?.pages.flatMap((page) => page.projects),
    [orgProjectsFromApi?.pages]
  )
  const organizationProjects =
    allProjects?.filter((project) => project.status !== PROJECT_STATUS.INACTIVE) ?? []
  const availableComputeCredits = organizationProjects.length === 0 ? 10 : 0
  const additionalMonthlySpend = isFreePlan
    ? 0
    : monthlyInstancePrice(instanceSize) - availableComputeCredits

  const selectedCloudProvider = cloudProvider as CloudProvider
  const { data: autoDefaultRegion, error: defaultRegionError } = useDefaultRegionQuery(
    {
      cloudProvider: selectedCloudProvider,
    },
    {
      enabled: flagsLoaded && !smartRegionEnabled,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchOnReconnect: false,
      retry: false,
    }
  )

  const { data: availableRegionsData, error: availableRegionsError } =
    useOrganizationAvailableRegionsQuery(
      {
        slug: slug,
        cloudProvider: PROVIDERS[cloudProvider as CloudProvider].id,
        desiredInstanceSize: instanceSize as DesiredInstanceSize,
      },
      {
        enabled: flagsLoaded && smartRegionEnabled,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        refetchOnReconnect: false,
      }
    )

  const recommendedSmartRegion = smartRegionEnabled
    ? availableRegionsData?.recommendations.smartGroup.name
    : ''

  const fixedDefaultRegion = PROVIDERS[selectedCloudProvider].default_region.displayName
  const regionError = smartRegionEnabled ? availableRegionsError : defaultRegionError
  const defaultRegion = smartRegionEnabled
    ? availableRegionsData?.recommendations.smartGroup.name
    : (autoDefaultRegion ?? fixedDefaultRegion)

  const canCreateProject = isAdmin && !freePlanWithExceedingLimits && !hasOutstandingInvoices
  const canConfigureGitHubOnCreate =
    canCreateProject && hasAccessToGitHubIntegration && canCreateGitHubConnection

  const dbRegionExact = smartRegionToExactRegion(dbRegion ?? '')

  const availableOrioleVersion = useAvailableOrioleImageVersion(
    {
      cloudProvider: cloudProvider as CloudProvider,
      dbRegion: smartRegionEnabled ? dbRegionExact : (dbRegion ?? ''),
      organizationSlug: organization,
    },
    { enabled: currentOrg !== null }
  )

  const userPrimaryEmail = profile?.primary_email?.toLowerCase()
  const isUserAtFreeProjectLimit = userPrimaryEmail
    ? membersExceededLimit.some(
        (member) => member.primary_email?.toLowerCase() === userPrimaryEmail
      )
    : false
  const shouldShowFreeProjectInfo =
    !!currentOrg && !isFreePlan && !isUserAtFreeProjectLimit && !isVercelIntegrationFlow
  const {
    gitHubAuthorization,
    githubRepos,
    hasPartialResponseDueToSSO,
    isLoading: isLoadingRepositoryOptions,
    refetch: refetchRepositoryOptions,
  } = useGitHubRepositoryOptions()

  const {
    mutate: createProject,
    isPending: isCreatingNewProject,
    isSuccess: isSuccessNewProject,
  } = useProjectCreateMutation({
    onSuccess: (res) => {
      track(
        'project_creation_simple_version_submitted',
        {
          surface,
          instanceSize: form.getValues('instanceSize'),
          enableRlsEventTrigger: form.getValues('enableRlsEventTrigger'),
          dataApiEnabled: form.getValues('dataApi'),
          dataApiDefaultPrivilegesGranted: form.getValues('dataApiDefaultPrivileges'),
          useOrioleDb: form.getValues('useOrioleDb'),
          ...(dataApiRevokeOnCreateDefaultFlag !== undefined && {
            dataApiRevokeOnCreateDefaultEnabled: dataApiRevokeOnCreateDefaultFlag,
          }),
        },
        {
          project: res.ref,
          organization: res.organization_slug,
        }
      )
      onCreateSuccess?.(res.ref)
      if (surface === 'main') router.push(`/project/${res.ref}`)
    },
    onError: (error) => {
      const toastId = toast.error(`Failed to create new project: ${error.message}`)
      trackFunnelError(
        'project_creation',
        classifyApiError('project_creation', error),
        'toast',
        toastId
      )
    },
  })

  const onSubmitWithComputeCostsConfirmation = async (values: z.infer<typeof FormSchema>) => {
    const launchingLargerInstance =
      values.instanceSize &&
      !sizesWithNoCostConfirmationRequired.includes(values.instanceSize as DesiredInstanceSize)

    if (additionalMonthlySpend > 0 && (hasOAuthApps || launchingLargerInstance)) {
      track('project_creation_simple_version_confirm_modal_opened', {
        instanceSize: values.instanceSize,
      })
      setIsComputeCostsConfirmationModalVisible(true)
    } else {
      await onSubmit(values)
    }
  }

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    if (!currentOrg) return console.error('Unable to retrieve current organization')

    const {
      cloudProvider,
      projectName,
      highAvailability,
      dbPass,
      dbRegion,
      postgresVersion,
      instanceType,
      instanceSize,
      dataApi,
      dataApiDefaultPrivileges,
      enableRlsEventTrigger,
      postgresVersionSelection,
      useOrioleDb,
      githubInstallationId,
      githubRepositoryId,
      shouldRunMigrations,
    } = values

    if (postgresVersion && !postgresVersion.match(/1[2-9]\..*/)) {
      return toast.error(
        `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`
      )
    }

    if (useOrioleDb && !availableOrioleVersion) {
      const toastId = toast.error('No available OrioleDB image found, only Postgres is available')
      trackFunnelError(
        'project_creation',
        { errorCategory: 'validation', errorReason: 'oriole_unavailable' },
        'toast',
        toastId
      )
      return
    }

    const { postgresEngine, releaseChannel } =
      extractPostgresVersionDetails(postgresVersionSelection)

    const { smartGroup = [], specific = [] } = availableRegionsData?.all ?? {}
    const selectedRegion = smartRegionEnabled
      ? (smartGroup.find((x) => x.name === dbRegion) ?? specific.find((x) => x.name === dbRegion))
      : undefined
    const parsedGitHubRepositoryId =
      githubRepositoryId.length > 0 ? Number(githubRepositoryId) : undefined
    const shouldIncludeGitHubFields =
      githubInstallationId !== undefined && Number.isFinite(parsedGitHubRepositoryId)

    let dbSql = enableRlsEventTrigger ? AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL : undefined
    if (isVercelIntegrationFlow && shouldRunMigrations && !!externalId) {
      const id = toast.loading(`Fetching initial migrations from GitHub repository...`)

      try {
        const migrationSql = await getInitialMigrationSQLFromGitHubRepo(externalId)
        if (migrationSql) {
          const safeMigrationSql = trimSafeSqlFragment(
            acceptUntrustedSql(untrustedSql(migrationSql))
          )
          dbSql = dbSql
            ? joinSqlFragments([trimSafeSqlFragment(dbSql), safeMigrationSql], ';\n')
            : safeMigrationSql
          toast.loading(`Migrations fetched! Creating project...`, { id })
        } else {
          toast.loading('No migrations found, creating project...')
        }
      } catch (error) {
        toast.loading(
          `Failed to fetch migrations: ${error instanceof Error ? error.message : ''}. Proceeding to create project...`,
          { id }
        )
      }
    }

    const data: ProjectCreateVariables = {
      dbSql,
      dbPass,
      cloudProvider,
      organizationSlug: currentOrg.slug,
      name: projectName,
      highAvailability,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize: isFreePlan ? undefined : (instanceSize as DesiredInstanceSize),
      dataApiExposedSchemas: !dataApi ? [] : undefined,
      dataApiUseApiSchema: false,
      dataApiRevokeDefaultPrivileges: dataApi && !dataApiDefaultPrivileges,
      postgresEngine: useOrioleDb ? availableOrioleVersion?.postgres_engine : postgresEngine,
      releaseChannel: useOrioleDb ? availableOrioleVersion?.release_channel : releaseChannel,
      ...(smartRegionEnabled ? { regionSelection: selectedRegion } : { dbRegion }),
      ...(shouldIncludeGitHubFields
        ? {
            githubInstallationId,
            githubRepositoryId: parsedGitHubRepositoryId,
          }
        : {}),
    }

    if (postgresVersion || instanceType) {
      data['customSupabaseRequest'] = {
        ami: {
          ...(postgresVersion && {
            search_tags: { 'tag:postgresVersion': postgresVersion },
          }),
          ...(instanceType && { instance_type: instanceType }),
        },
      }
    }

    createProject(data)
  }

  const hasTrackedFormExposed = useRef(false)

  useEffect(() => {
    if (hasTrackedFormExposed.current) return
    if (!isOrganizationsSuccess || !canCreateProject || !currentOrg) return
    hasTrackedFormExposed.current = true
    track('project_creation_form_exposed', { surface })
  }, [isOrganizationsSuccess, canCreateProject, currentOrg, track, surface])

  useEffect(() => {
    // Only set once to ensure compute credits dont change while project is being created
    if (allOrgProjects && allOrgProjects.length > 0 && !allProjects) {
      setAllProjects(allOrgProjects)
    }
  }, [allOrgProjects, allProjects, setAllProjects])

  useEffect(() => {
    // Handle no org: redirect to new org route
    if (isEmptyOrganizations && !isVercelIntegrationFlow) {
      router.push(`/new`)
    }
  }, [isEmptyOrganizations, isVercelIntegrationFlow, router])

  useEffect(() => {
    // [Joshen] Cause slug depends on router which doesnt load immediately on render
    // While the form data does load immediately
    if (slug && slug !== '_') setValue('organization', slug)
    if (projectName) setValue('projectName', projectName || '')
  }, [slug, setValue, projectName])

  useEffect(() => {
    if (!isDbRegionDirty && defaultRegion) {
      setValue('dbRegion', defaultRegion)
    }
  }, [defaultRegion, isDbRegionDirty, setValue])

  useEffect(() => {
    if (!isDbRegionDirty && recommendedSmartRegion) {
      setValue('dbRegion', recommendedSmartRegion)
    }
  }, [recommendedSmartRegion, isDbRegionDirty, setValue])

  useEffect(() => {
    if (regionError && fixedDefaultRegion) {
      resetField('dbRegion', { defaultValue: fixedDefaultRegion })
    }
  }, [regionError, resetField, fixedDefaultRegion])

  useEffect(() => {
    if (highAvailability && cloudProvider !== 'AWS_K8S') {
      setValue('cloudProvider', 'AWS_K8S')
    }
  }, [highAvailability, cloudProvider, setValue])

  useEffect(() => {
    if (watchedInstanceSize !== instanceSize) {
      setValue('instanceSize', instanceSize, {
        shouldDirty: false,
        shouldValidate: false,
        shouldTouch: false,
      })
    }
  }, [instanceSize, watchedInstanceSize, setValue])

  useEffect(() => {
    if (!githubRepositoryName) return
    if ((watchedProjectName ?? '').trim().length > 0) return

    const repoName = githubRepositoryName.split('/').at(-1) ?? githubRepositoryName
    setValue('projectName', repoName.trim(), {
      shouldValidate: true,
    })
  }, [githubRepositoryName, watchedProjectName, setValue])

  useEffect(() => {
    if (dataApiRevokeOnCreateDefaultFlag === undefined) return
    if (isDataApiDefaultPrivilegesDirty) return
    setValue(
      'dataApiDefaultPrivileges',
      !isInDataApiRevokeTreatment(dataApiRevokeOnCreateDefaultFlag),
      {
        shouldDirty: false,
      }
    )
  }, [dataApiRevokeOnCreateDefaultFlag, isDataApiDefaultPrivilegesDirty, setValue])

  useEffect(() => {
    // This is to make the database.new redirect work correctly. The database.new redirect should be set to supabase.com/dashboard/new/last-visited-org
    if (slug === 'last-visited-org') {
      if (lastVisitedOrganization) {
        router.replace(`/new/${lastVisitedOrganization}`, undefined, { shallow: true })
      } else {
        router.replace(`/new/_`, undefined, { shallow: true })
      }
    }
  }, [slug, lastVisitedOrganization, router])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitWithComputeCostsConfirmation, (errors) =>
          trackFunnelError(
            'project_creation',
            classifyValidationError('project_creation', errors),
            'form'
          )
        )}
      >
        <Panel
          loading={!isOrganizationsSuccess}
          title={
            <div key="panel-title">
              <h3>Create a new project</h3>
              <p className="text-sm text-foreground-lighter text-balance">
                Your project will have its own dedicated instance and full Postgres database. An API
                will be set up so you can easily interact with your new database.
              </p>
            </div>
          }
          footer={
            <ProjectCreationFooter
              form={form}
              canCreateProject={canCreateProject}
              instanceSize={instanceSize}
              organizationProjects={organizationProjects}
              isCreatingNewProject={isCreatingNewProject}
              isSuccessNewProject={isSuccessNewProject}
              hideCancelButton={isVercelIntegrationFlow}
            />
          }
        >
          <>
            {projectCreationDisabled ? (
              <DisabledWarningDueToIncident title="Project creation is currently disabled" />
            ) : (
              <div className="divide-y divide-border-border">
                <OrganizationSelector
                  form={form}
                  disableOrganizationSelection={isVercelIntegrationFlow}
                />

                {canCreateProject && (
                  <>
                    {!isVercelIntegrationFlow && canConfigureGitHubOnCreate && (
                      <Panel.Content>
                        <GitHubRepositoryField
                          form={form}
                          name="githubRepositoryId"
                          installationIdField="githubInstallationId"
                          repositoryNameField="githubRepositoryName"
                          label="GitHub (optional)"
                          description={
                            <>
                              Ideal for agent-first workflows: update your schema in code, push it
                              to GitHub, and Supabase deploys the changes automatically.{' '}
                              <a
                                href="https://supabase.com/docs/guides/deployment/branching/github-integration"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-link"
                              >
                                Learn more
                              </a>
                            </>
                          }
                          disabled={isCreatingNewProject}
                          repositories={githubRepos}
                          gitHubAuthorization={gitHubAuthorization}
                          hasPartialResponseDueToSSO={hasPartialResponseDueToSSO}
                          isLoading={isLoadingRepositoryOptions}
                          refetch={refetchRepositoryOptions}
                          onConnectClick={() => track('project_creation_github_connect_clicked')}
                        />
                      </Panel.Content>
                    )}
                    <ProjectNameInput form={form} />

                    {canChooseInstanceSize && <ComputeSizeSelector form={form} />}

                    <DatabasePasswordInput form={form} />

                    <RegionSelector
                      form={form}
                      instanceSize={instanceSize as DesiredInstanceSize}
                    />

                    {isVercelIntegrationFlow && !!externalId && <DataSeeding form={form} />}

                    <SecurityOptions form={form} surface={surface} />

                    {showInternalOnlyConfiguration && <InternalOnlyConfiguration form={form} />}

                    {showAdvancedConfig && !!availableOrioleVersion && (
                      <AdvancedConfiguration form={form} />
                    )}

                    {shouldShowFreeProjectInfo ? (
                      <Admonition
                        className="rounded-none border-0"
                        type="note"
                        title="Need a free project?"
                        description={
                          <p>
                            You can have up to 2 free projects across all organizations.{' '}
                            <Link className="underline text-foreground" href="/new">
                              Create a free organization
                            </Link>{' '}
                            to use them.
                          </p>
                        }
                      />
                    ) : null}
                  </>
                )}

                {freePlanWithExceedingLimits ? (
                  isAdmin &&
                  slug && (
                    <FreeProjectLimitWarning membersExceededLimit={membersExceededLimit || []} />
                  )
                ) : hasOutstandingInvoices ? (
                  <Panel.Content>
                    <Admonition
                      type="default"
                      title="Your organization has overdue invoices"
                      description={
                        <div className="space-y-3">
                          <p className="text-sm leading-normal">
                            Please resolve all outstanding invoices first before creating a new
                            project
                          </p>

                          <div>
                            <Button asChild variant="default">
                              <Link href={`/org/${slug}/billing#invoices`}>View invoices</Link>
                            </Button>
                          </div>
                        </div>
                      }
                    />
                  </Panel.Content>
                ) : null}
              </div>
            )}
          </>
        </Panel>

        <ConfirmationModal
          size="large"
          variant="warning"
          loading={isCreatingNewProject}
          visible={isComputeCostsConfirmationModalVisible}
          title="Confirm compute costs"
          confirmLabel="I understand"
          onCancel={() => setIsComputeCostsConfirmationModalVisible(false)}
          onConfirm={async () => {
            const values = form.getValues()
            await onSubmit(values)
            setIsComputeCostsConfirmationModalVisible(false)
          }}
        >
          <div className="text-sm text-foreground-light space-y-1">
            <p>
              Launching a project on compute size "{instanceLabel(instanceSize)}" increases your
              monthly costs by ${additionalMonthlySpend}, independent of how actively you use it. By
              clicking "I understand", you agree to the additional costs.{' '}
              <Link
                href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
                target="_blank"
                className="underline"
              >
                Compute Costs
              </Link>{' '}
              are non-refundable.
            </p>
          </div>
        </ConfirmationModal>
      </form>
    </Form>
  )
}
