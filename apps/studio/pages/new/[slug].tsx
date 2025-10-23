import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { AdvancedConfiguration } from 'components/interfaces/ProjectCreation/AdvancedConfiguration'
import { CloudProviderSelector } from 'components/interfaces/ProjectCreation/CloudProviderSelector'
import { ComputeSizeSelector } from 'components/interfaces/ProjectCreation/ComputeSizeSelector'
import { CustomPostgresVersionInput } from 'components/interfaces/ProjectCreation/CustomPostgresVersionInput'
import { DatabasePasswordInput } from 'components/interfaces/ProjectCreation/DatabasePasswordInput'
import { DisabledWarningDueToIncident } from 'components/interfaces/ProjectCreation/DisabledWarningDueToIncident'
import { FreeProjectLimitWarning } from 'components/interfaces/ProjectCreation/FreeProjectLimitWarning'
import { OrganizationSelector } from 'components/interfaces/ProjectCreation/OrganizationSelector'
import {
  extractPostgresVersionDetails,
  PostgresVersionSelector,
} from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { sizes } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { FormSchema } from 'components/interfaces/ProjectCreation/ProjectCreation.schema'
import {
  instanceLabel,
  smartRegionToExactRegion,
} from 'components/interfaces/ProjectCreation/ProjectCreation.utils'
import { ProjectCreationFooter } from 'components/interfaces/ProjectCreation/ProjectCreationFooter'
import { ProjectNameInput } from 'components/interfaces/ProjectCreation/ProjectNameInput'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { SecurityOptions } from 'components/interfaces/ProjectCreation/SecurityOptions'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import Panel from 'components/ui/Panel'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { useAvailableOrioleImageVersion } from 'data/config/project-creation-postgres-versions-query'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationAvailableRegionsQuery } from 'data/organizations/organization-available-regions-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { DesiredInstanceSize, instanceSizeSpecs } from 'data/projects/new-project.constants'
import { OrgProject, useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import {
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DOCS_URL,
  MANAGED_BY,
  PROJECT_STATUS,
  PROVIDERS,
  useDefaultProvider,
} from 'lib/constants'
import { AWS_REGIONS, type CloudProvider } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import { Button, Form_Shadcn_, FormField_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

// [Joshen] This page is getting rather big and complex, let's aim to break this down into smaller components

const sizesWithNoCostConfirmationRequired: DesiredInstanceSize[] = ['micro', 'small']

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, projectName } = useParams()
  const defaultProvider = useDefaultProvider()

  const { data: currentOrg } = useSelectedOrganizationQuery()
  const isFreePlan = currentOrg?.plan?.id === 'free'
  const canChooseInstanceSize = !isFreePlan

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )
  const { can: isAdmin } = useAsyncCheckPermissions(PermissionAction.CREATE, 'projects')
  const showAdvancedConfig = useIsFeatureEnabled('project_creation:show_advanced_config')

  const smartRegionEnabled = useFlag('enableSmartRegion')
  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const showPostgresVersionSelector = useFlag('showPostgresVersionSelector')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const isHomeNew = useFlag('homeNew')

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'
  const isManagedByVercel = currentOrg?.managed_by === 'vercel-marketplace'
  const isNotOnTeamOrEnterprisePlan = useMemo(
    () => !['team', 'enterprise'].includes(currentOrg?.plan.id ?? ''),
    [currentOrg]
  )

  // This is to make the database.new redirect work correctly. The database.new redirect should be set to supabase.com/dashboard/new/last-visited-org
  if (slug === 'last-visited-org') {
    if (lastVisitedOrganization) {
      router.replace(`/new/${lastVisitedOrganization}`, undefined, { shallow: true })
    } else {
      router.replace(`/new/_`, undefined, { shallow: true })
    }
  }

  const [allProjects, setAllProjects] = useState<OrgProject[] | undefined>(undefined)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [isComputeCostsConfirmationModalVisible, setIsComputeCostsConfirmationModalVisible] =
    useState(false)

  const { mutate: sendEvent } = useSendEventMutation()

  FormSchema.superRefine(({ dbPassStrength }, refinementContext) => {
    if (dbPassStrength < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dbPass'],
        message: passwordStrengthWarning || 'Password not secure enough',
      })
    }
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      organization: slug,
      projectName: projectName || '',
      postgresVersion: '',
      cloudProvider: PROVIDERS[defaultProvider].id,
      dbPass: '',
      dbPassStrength: 0,
      dbRegion: undefined,
      instanceSize: canChooseInstanceSize ? sizes[0] : undefined,
      dataApi: true,
      useApiSchema: false,
      postgresVersionSelection: '',
      useOrioleDb: false,
    },
  })
  const { instanceSize: watchedInstanceSize, cloudProvider, dbRegion, organization } = form.watch()

  // [Charis] Since the form is updated in a useEffect, there is an edge case
  // when switching from free to paid, where canChooseInstanceSize is true for
  // an in-between render, but watchedInstanceSize is still undefined from the
  // form state carried over from the free plan. To avoid this, we set a
  // default instance size in this case.
  const instanceSize = canChooseInstanceSize ? watchedInstanceSize ?? sizes[0] : undefined

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
    enabled: isNotOnTeamOrEnterprisePlan,
  })
  const overdueInvoices = allOverdueInvoices.filter((x) => x.organization_id === currentOrg?.id)
  const hasOutstandingInvoices = isNotOnTeamOrEnterprisePlan && overdueInvoices.length > 0

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
    : instanceSizeSpecs[instanceSize as DesiredInstanceSize]!.priceMonthly - availableComputeCredits

  const { data: _defaultRegion, error: defaultRegionError } = useDefaultRegionQuery(
    {
      cloudProvider: PROVIDERS[defaultProvider].id,
    },
    {
      enabled: !smartRegionEnabled,
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
        enabled: smartRegionEnabled,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        refetchOnReconnect: false,
      }
    )
  const recommendedSmartRegion = smartRegionEnabled
    ? availableRegionsData?.recommendations.smartGroup.name
    : undefined
  const regionError =
    smartRegionEnabled && defaultProvider !== 'AWS_NIMBUS'
      ? availableRegionsError
      : defaultRegionError
  const defaultRegion =
    defaultProvider === 'AWS_NIMBUS'
      ? AWS_REGIONS.EAST_US.displayName
      : smartRegionEnabled
        ? availableRegionsData?.recommendations.smartGroup.name
        : _defaultRegion

  const canCreateProject =
    isAdmin && !freePlanWithExceedingLimits && !isManagedByVercel && !hasOutstandingInvoices

  const dbRegionExact = smartRegionToExactRegion(dbRegion)

  const availableOrioleVersion = useAvailableOrioleImageVersion(
    {
      cloudProvider: cloudProvider as CloudProvider,
      dbRegion: smartRegionEnabled ? dbRegionExact : dbRegion,
      organizationSlug: organization,
    },
    { enabled: currentOrg !== null && !isManagedByVercel }
  )

  const {
    mutate: createProject,
    isLoading: isCreatingNewProject,
    isSuccess: isSuccessNewProject,
  } = useProjectCreateMutation({
    onSuccess: (res) => {
      sendEvent({
        action: 'project_creation_simple_version_submitted',
        properties: {
          instanceSize: form.getValues('instanceSize'),
        },
        groups: {
          project: res.ref,
          organization: res.organization_slug,
        },
      })
      router.push(isHomeNew ? `/project/${res.ref}` : `/project/${res.ref}/building`)
    },
  })

  const onSubmitWithComputeCostsConfirmation = async (values: z.infer<typeof FormSchema>) => {
    const launchingLargerInstance =
      values.instanceSize &&
      !sizesWithNoCostConfirmationRequired.includes(values.instanceSize as DesiredInstanceSize)

    if (additionalMonthlySpend > 0 && (hasOAuthApps || launchingLargerInstance)) {
      sendEvent({
        action: 'project_creation_simple_version_confirm_modal_opened',
        properties: {
          instanceSize: values.instanceSize,
        },
        groups: {
          organization: currentOrg?.slug ?? 'Unknown',
        },
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
      dbPass,
      dbRegion,
      postgresVersion,
      instanceSize,
      dataApi,
      useApiSchema,
      postgresVersionSelection,
      useOrioleDb,
    } = values

    if (useOrioleDb && !availableOrioleVersion) {
      return toast.error('No available OrioleDB image found, only Postgres is available')
    }

    const { postgresEngine, releaseChannel } =
      extractPostgresVersionDetails(postgresVersionSelection)

    const { smartGroup = [], specific = [] } = availableRegionsData?.all ?? {}
    const selectedRegion = smartRegionEnabled
      ? smartGroup.find((x) => x.name === dbRegion) ?? specific.find((x) => x.name === dbRegion)
      : undefined

    const data: ProjectCreateVariables = {
      dbPass,
      cloudProvider,
      organizationSlug: currentOrg.slug,
      name: projectName,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize: isFreePlan ? undefined : (instanceSize as DesiredInstanceSize),
      dataApiExposedSchemas: !dataApi ? [] : undefined,
      dataApiUseApiSchema: !dataApi ? false : useApiSchema,
      postgresEngine: useOrioleDb ? availableOrioleVersion?.postgres_engine : postgresEngine,
      releaseChannel: useOrioleDb ? availableOrioleVersion?.release_channel : releaseChannel,
      ...(smartRegionEnabled ? { regionSelection: selectedRegion } : { dbRegion }),
    }

    if (postgresVersion) {
      if (!postgresVersion.match(/1[2-9]\..*/)) {
        toast.error(
          `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`
        )
      }

      data['customSupabaseRequest'] = {
        ami: { search_tags: { 'tag:postgresVersion': postgresVersion } },
      }
    }

    createProject(data)
  }

  useEffect(() => {
    // Only set once to ensure compute credits dont change while project is being created
    if (allOrgProjects && allOrgProjects.length > 0 && !allProjects) {
      setAllProjects(allOrgProjects)
    }
  }, [allOrgProjects, allProjects, setAllProjects])

  useEffect(() => {
    // Handle no org: redirect to new org route
    if (isEmptyOrganizations) {
      router.push(`/new`)
    }
  }, [isEmptyOrganizations, router])

  useEffect(() => {
    // [Joshen] Cause slug depends on router which doesnt load immediately on render
    // While the form data does load immediately
    if (slug && slug !== '_') form.setValue('organization', slug)
    if (projectName) form.setValue('projectName', projectName || '')
  }, [slug])

  useEffect(() => {
    if (form.getValues('dbRegion') === undefined && defaultRegion) {
      form.setValue('dbRegion', defaultRegion)
    }
  }, [defaultRegion])

  useEffect(() => {
    if (regionError) {
      form.setValue('dbRegion', PROVIDERS[defaultProvider].default_region.displayName)
    }
  }, [regionError])

  useEffect(() => {
    if (recommendedSmartRegion) {
      form.setValue('dbRegion', recommendedSmartRegion)
    }
  }, [recommendedSmartRegion])

  useEffect(() => {
    if (watchedInstanceSize !== instanceSize) {
      form.setValue('instanceSize', instanceSize, {
        shouldDirty: false,
        shouldValidate: false,
        shouldTouch: false,
      })
    }
  }, [instanceSize, watchedInstanceSize, form])

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWithComputeCostsConfirmation)}>
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
            />
          }
        >
          <>
            {projectCreationDisabled ? (
              <DisabledWarningDueToIncident title="Project creation is currently disabled" />
            ) : (
              <div className="divide-y divide-border-muted">
                <OrganizationSelector form={form} />

                {canCreateProject && (
                  <>
                    <ProjectNameInput form={form} />

                    {cloudProviderEnabled && showNonProdFields && (
                      <CloudProviderSelector form={form} />
                    )}

                    {canChooseInstanceSize && <ComputeSizeSelector form={form} />}

                    <DatabasePasswordInput
                      form={form}
                      passwordStrengthMessage={passwordStrengthMessage}
                      setPasswordStrengthMessage={setPasswordStrengthMessage}
                      setPasswordStrengthWarning={setPasswordStrengthWarning}
                    />

                    <RegionSelector
                      form={form}
                      instanceSize={instanceSize as DesiredInstanceSize}
                    />

                    {showPostgresVersionSelector && (
                      <Panel.Content>
                        <FormField_Shadcn_
                          control={form.control}
                          name="postgresVersionSelection"
                          render={({ field }) => (
                            <PostgresVersionSelector
                              field={field}
                              form={form}
                              cloudProvider={form.getValues('cloudProvider') as CloudProvider}
                              organizationSlug={slug}
                              dbRegion={form.getValues('dbRegion')}
                            />
                          )}
                        />
                      </Panel.Content>
                    )}

                    {showNonProdFields && <CustomPostgresVersionInput form={form} />}

                    <SecurityOptions form={form} />
                    {showAdvancedConfig && !!availableOrioleVersion && (
                      <AdvancedConfiguration form={form} />
                    )}
                  </>
                )}

                {freePlanWithExceedingLimits ? (
                  isAdmin &&
                  slug && (
                    <FreeProjectLimitWarning membersExceededLimit={membersExceededLimit || []} />
                  )
                ) : isManagedByVercel ? (
                  <Panel.Content>
                    <PartnerManagedResource
                      managedBy={MANAGED_BY.VERCEL_MARKETPLACE}
                      resource="Projects"
                      cta={{
                        installationId: currentOrg?.partner_id,
                        message: 'Visit Vercel to create a project',
                      }}
                    />
                  </Panel.Content>
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
                            <Button asChild type="default">
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
          loading={false}
          visible={isComputeCostsConfirmationModalVisible}
          title="Confirm compute costs"
          confirmLabel="I understand"
          onCancel={() => setIsComputeCostsConfirmationModalVisible(false)}
          onConfirm={async () => {
            const values = form.getValues()
            await onSubmit(values)
            setIsComputeCostsConfirmationModalVisible(false)
          }}
          variant={'warning'}
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
    </Form_Shadcn_>
  )
}

const PageLayout = withAuth(({ children }: PropsWithChildren) => {
  return <WizardLayoutWithoutAuth>{children}</WizardLayoutWithoutAuth>
})

Wizard.getLayout = (page) => (
  <DefaultLayout headerTitle="New project">
    <PageLayout>{page}</PageLayout>
  </DefaultLayout>
)

export default Wizard
