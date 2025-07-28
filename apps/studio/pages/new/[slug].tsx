import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { debounce } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import { OrgNotFound } from 'components/interfaces/Organization/OrgNotFound'
import { AdvancedConfiguration } from 'components/interfaces/ProjectCreation/AdvancedConfiguration'
import {
  extractPostgresVersionDetails,
  PostgresVersionSelector,
} from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { SPECIAL_CHARS_REGEX } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { SecurityOptions } from 'components/interfaces/ProjectCreation/SecurityOptions'
import { SpecialSymbolsCallout } from 'components/interfaces/ProjectCreation/SpecialSymbolsCallout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useAvailableOrioleImageVersion } from 'data/config/project-creation-postgres-versions-query'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { DesiredInstanceSize, instanceSizeSpecs } from 'data/projects/new-project.constants'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import {
  AWS_REGIONS_DEFAULT,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  FLY_REGIONS_DEFAULT,
  PROJECT_STATUS,
  PROVIDERS,
} from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import type { CloudProvider } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

const sizes: DesiredInstanceSize[] = [
  'micro',
  'small',
  'medium',
  'large',
  'xlarge',
  '2xlarge',
  '4xlarge',
  '8xlarge',
  '12xlarge',
  '16xlarge',
]

const sizesWithNoCostConfirmationRequired: DesiredInstanceSize[] = ['micro', 'small']

const FormSchema = z.object({
  organization: z.string({
    required_error: 'Please select an organization',
  }),
  projectName: z
    .string()
    .min(1, 'Please enter a project name.') // Required field check
    .min(3, 'Project name must be at least 3 characters long.') // Minimum length check
    .max(64, 'Project name must be no longer than 64 characters.'), // Maximum length check
  postgresVersion: z.string({
    required_error: 'Please enter a Postgres version.',
  }),
  dbRegion: z.string({
    required_error: 'Please select a region.',
  }),
  cloudProvider: z.string({
    required_error: 'Please select a cloud provider.',
  }),
  dbPassStrength: z.number(),
  dbPass: z
    .string({ required_error: 'Please enter a database password.' })
    .min(1, 'Password is required.'),
  instanceSize: z.string(),
  dataApi: z.boolean(),
  useApiSchema: z.boolean(),
  postgresVersionSelection: z.string(),
  useOrioleDb: z.boolean(),
})

export type CreateProjectForm = z.infer<typeof FormSchema>

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, projectName } = useParams()
  const currentOrg = useSelectedOrganization()
  const isFreePlan = currentOrg?.plan?.id === 'free'
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  // This is to make the database.new redirect work correctly. The database.new redirect should be set to supabase.com/dashboard/new/last-visited-org
  if (slug === 'last-visited-org') {
    if (lastVisitedOrganization) {
      router.replace(`/new/${lastVisitedOrganization}`, undefined, { shallow: true })
    } else {
      router.replace(`/new/_`, undefined, { shallow: true })
    }
  }

  const { mutate: sendEvent } = useSendEventMutation()

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const showPostgresVersionSelector = useFlag('showPostgresVersionSelector')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug },
    { enabled: isFreePlan }
  )

  const { data: approvedOAuthApps } = useAuthorizedAppsQuery(
    { slug },
    { enabled: !isFreePlan && slug !== '_' }
  )

  const hasOAuthApps = approvedOAuthApps && approvedOAuthApps.length > 0

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const [isComputeCostsConfirmationModalVisible, setIsComputeCostsConfirmationModalVisible] =
    useState(false)

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()

  const isNotOnTeamOrEnterprisePlan = useMemo(
    () => !['team', 'enterprise'].includes(currentOrg?.plan.id ?? ''),
    [currentOrg]
  )

  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({
    enabled: isNotOnTeamOrEnterprisePlan,
  })

  const overdueInvoices = (allOverdueInvoices ?? []).filter(
    (x) => x.organization_id === currentOrg?.id
  )
  const hasOutstandingInvoices = overdueInvoices.length > 0 && isNotOnTeamOrEnterprisePlan

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
      router.push(`/project/${res.ref}/building`)
    },
  })

  const { data: allProjectsFromApi } = useProjectsQuery()
  const [allProjects, setAllProjects] = useState<
    components['schemas']['ProjectInfo'][] | undefined
  >(undefined)

  useEffect(() => {
    // Only set once to ensure compute credits dont change while project is being created
    if (allProjectsFromApi && !allProjects) {
      setAllProjects(allProjectsFromApi)
    }
  }, [allProjectsFromApi, allProjects, setAllProjects])

  const organizationProjects =
    allProjects?.filter(
      (project) =>
        project.organization_id === currentOrg?.id && project.status !== PROJECT_STATUS.INACTIVE
    ) ?? []
  const { data: defaultRegion, error: defaultRegionError } = useDefaultRegionQuery(
    {
      cloudProvider: PROVIDERS[DEFAULT_PROVIDER].id,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchOnReconnect: false,
      retry: false,
    }
  )

  const isAdmin = useCheckPermissions(PermissionAction.CREATE, 'projects')

  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const orgNotFound = isOrganizationsSuccess && (organizations?.length ?? 0) > 0 && isInvalidSlug
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

  const freePlanWithExceedingLimits = isFreePlan && hasMembersExceedingFreeTierLimit

  const isManagedByVercel = currentOrg?.managed_by === 'vercel-marketplace'

  const canCreateProject =
    isAdmin && !freePlanWithExceedingLimits && !isManagedByVercel && !hasOutstandingInvoices

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)

    form.setValue('dbPassStrength', strength)
    form.trigger('dbPassStrength')
    form.trigger('dbPass')

    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

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
      cloudProvider: PROVIDERS[DEFAULT_PROVIDER].id,
      dbPass: '',
      dbPassStrength: 0,
      dbRegion: defaultRegion || undefined,
      instanceSize: sizes[0],
      dataApi: true,
      useApiSchema: false,
      postgresVersionSelection: '',
      useOrioleDb: false,
    },
  })

  const { instanceSize, cloudProvider, dbRegion, organization } = form.watch()

  const availableOrioleVersion = useAvailableOrioleImageVersion(
    {
      cloudProvider: cloudProvider as CloudProvider,
      dbRegion,
      organizationSlug: organization,
    },
    { enabled: currentOrg != null && !isManagedByVercel }
  )

  // [kevin] This will eventually all be provided by a new API endpoint to preview and validate project creation, this is just for kaizen now
  const monthlyComputeCosts =
    // current project costs
    organizationProjects.reduce(
      (prev, acc) => prev + monthlyInstancePrice(acc.infra_compute_size),
      0
    ) +
    // selected compute size
    monthlyInstancePrice(instanceSize) -
    // compute credits
    10

  // [Refactor] DB Password could be a common component used in multiple pages with repeated logic
  function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password)
    delayedCheckPasswordStrength(password)
  }

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

    const data: ProjectCreateVariables = {
      cloudProvider: cloudProvider,
      organizationSlug: currentOrg.slug,
      name: projectName,
      dbPass: dbPass,
      dbRegion: dbRegion,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize: isFreePlan ? undefined : (instanceSize as DesiredInstanceSize),
      dataApiExposedSchemas: !dataApi ? [] : undefined,
      dataApiUseApiSchema: !dataApi ? false : useApiSchema,
      postgresEngine: useOrioleDb ? availableOrioleVersion?.postgres_engine : postgresEngine,
      releaseChannel: useOrioleDb ? availableOrioleVersion?.release_channel : releaseChannel,
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
    if (defaultRegionError) {
      form.setValue('dbRegion', PROVIDERS[DEFAULT_PROVIDER].default_region.displayName)
    }
  }, [defaultRegionError])

  const availableComputeCredits = organizationProjects.length === 0 ? 10 : 0

  const additionalMonthlySpend = isFreePlan
    ? 0
    : instanceSizeSpecs[instanceSize as DesiredInstanceSize]!.priceMonthly - availableComputeCredits

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWithComputeCostsConfirmation)}>
        <Panel
          loading={!isOrganizationsSuccess}
          title={
            <div key="panel-title">
              <h3>Create a new project</h3>
              <p className="text-sm text-foreground-lighter">
                Your project will have its own dedicated instance and full Postgres database.
                <br />
                An API will be set up so you can easily interact with your new database.
                <br />
              </p>
            </div>
          }
          footer={
            <div key="panel-footer" className="grid grid-cols-12 w-full gap-4 items-center">
              <div className="col-span-4">
                {!isFreePlan &&
                  !projectCreationDisabled &&
                  canCreateProject &&
                  additionalMonthlySpend > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Additional Costs</span>
                      <div className="text-brand flex gap-1 items-center font-mono font-medium">
                        <span>${additionalMonthlySpend}/m</span>
                        <InfoTooltip side="top" className="max-w-[450px] p-0">
                          <div className="p-4 text-sm text-foreground-light space-y-1">
                            <p>
                              Each project includes a dedicated Postgres instance running on its own
                              server. You are charged for the{' '}
                              <InlineLink href="https://supabase.com/docs/guides/platform/billing-on-supabase">
                                Compute resource
                              </InlineLink>{' '}
                              of that server, independent of your database usage.
                            </p>
                            {monthlyComputeCosts > 0 && (
                              <p>
                                Compute costs are applied on top of your subscription plan costs.
                              </p>
                            )}
                          </div>

                          <Table className="mt-2">
                            <TableHeader className="[&_th]:h-7">
                              <TableRow className="py-2">
                                <TableHead className="w-[170px]">Project</TableHead>
                                <TableHead>Compute Size</TableHead>
                                <TableHead className="text-right">Monthly Costs</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="[&_td]:py-2">
                              {organizationProjects.map((project) => (
                                <TableRow key={project.ref} className="text-foreground-light">
                                  <TableCell className="w-[170px] truncate">
                                    {project.name}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {instanceLabel(project.infra_compute_size)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${monthlyInstancePrice(project.infra_compute_size)}
                                  </TableCell>
                                </TableRow>
                              ))}

                              <TableRow>
                                <TableCell className="w-[170px] flex gap-2">
                                  <span className="truncate">
                                    {form.getValues('projectName')
                                      ? form.getValues('projectName')
                                      : 'New project'}
                                  </span>
                                  <Badge size={'small'} variant={'default'}>
                                    NEW
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {instanceLabel(instanceSize)}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${monthlyInstancePrice(instanceSize)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <PopoverSeparator />
                          <Table>
                            <TableHeader className="[&_th]:h-7">
                              <TableRow>
                                <TableHead colSpan={2}>Compute Credits</TableHead>
                                <TableHead colSpan={1} className="text-right">
                                  -$10
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="[&_td]:py-2">
                              <TableRow className="text-foreground">
                                <TableCell colSpan={2}>
                                  Total Monthly Compute Costs
                                  {/**
                                   * API currently doesnt output replica information on the projects list endpoint. Until then, we cannot correctly calculate the costs including RRs.
                                   * Will be adjusted in the future [kevin]
                                   */}
                                  {organizationProjects.length > 0 && (
                                    <p className="text-xs text-foreground-lighter">
                                      Excluding Read replicas
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell colSpan={1} className="text-right">
                                  ${monthlyComputeCosts}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </InfoTooltip>
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex items-end col-span-8 space-x-2 ml-auto">
                <Button
                  type="default"
                  disabled={isCreatingNewProject || isSuccessNewProject}
                  onClick={() => {
                    if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
                    else router.push('/organizations')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  htmlType="submit"
                  loading={isCreatingNewProject || isSuccessNewProject}
                  disabled={!canCreateProject || isCreatingNewProject || isSuccessNewProject}
                >
                  Create new project
                </Button>
              </div>
            </div>
          }
        >
          <>
            {projectCreationDisabled ? (
              <Panel.Content className="pb-8">
                <DisabledWarningDueToIncident title="Project creation is currently disabled" />
              </Panel.Content>
            ) : (
              <div className="divide-y divide-border-muted">
                <Panel.Content className={['space-y-4'].join(' ')}>
                  {isAdmin && !isInvalidSlug && (
                    <FormField_Shadcn_
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItemLayout label="Organization" layout="horizontal">
                          {(organizations?.length ?? 0) > 0 && (
                            <Select_Shadcn_
                              onValueChange={(slug) => {
                                field.onChange(slug)
                                router.push(`/new/${slug}`)
                              }}
                              value={field.value}
                              defaultValue={field.value}
                            >
                              <FormControl_Shadcn_>
                                <SelectTrigger_Shadcn_>
                                  <SelectValue_Shadcn_ placeholder="Select an organization" />
                                </SelectTrigger_Shadcn_>
                              </FormControl_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectGroup_Shadcn_>
                                  {organizations?.map((x) => (
                                    <SelectItem_Shadcn_
                                      key={x.id}
                                      value={x.slug}
                                      className="flex justify-between"
                                    >
                                      <span className="mr-2">{x.name}</span>
                                      <Badge>{x.plan.name}</Badge>
                                    </SelectItem_Shadcn_>
                                  ))}
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          )}
                        </FormItemLayout>
                      )}
                    />
                  )}

                  {isOrganizationsSuccess && !isAdmin && !orgNotFound && (
                    <NotOrganizationOwnerWarning slug={slug} />
                  )}
                  {orgNotFound && <OrgNotFound slug={slug} />}
                </Panel.Content>

                {canCreateProject && (
                  <>
                    <Panel.Content>
                      <FormField_Shadcn_
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                          <FormItemLayout label="Project name" layout="horizontal">
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} placeholder="Project name" />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </Panel.Content>

                    {cloudProviderEnabled && showNonProdFields && (
                      <Panel.Content>
                        <FormField_Shadcn_
                          control={form.control}
                          name="cloudProvider"
                          render={({ field }) => (
                            <FormItemLayout label="Cloud provider" layout="horizontal">
                              <Select_Shadcn_
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  form.setValue(
                                    'dbRegion',
                                    value === 'FLY'
                                      ? FLY_REGIONS_DEFAULT.displayName
                                      : AWS_REGIONS_DEFAULT.displayName
                                  )
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl_Shadcn_>
                                  <SelectTrigger_Shadcn_>
                                    <SelectValue_Shadcn_ placeholder="Select a cloud provider" />
                                  </SelectTrigger_Shadcn_>
                                </FormControl_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    {Object.values(PROVIDERS).map((providerObj) => {
                                      const label = providerObj['name']
                                      const value = providerObj['id']
                                      return (
                                        <SelectItem_Shadcn_ key={value} value={value}>
                                          {label}
                                        </SelectItem_Shadcn_>
                                      )
                                    })}
                                  </SelectGroup_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </Panel.Content>
                    )}

                    {currentOrg?.plan && currentOrg?.plan.id !== 'free' && (
                      <Panel.Content>
                        <FormField_Shadcn_
                          control={form.control}
                          name="instanceSize"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="horizontal"
                              label={
                                <div className="flex flex-col gap-y-4">
                                  <span>Compute Size</span>

                                  <div className="flex flex-col gap-y-2">
                                    <Link
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href="https://supabase.com/docs/guides/platform/compute-add-ons"
                                    >
                                      <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                        <p className="text-sm m-0">Compute Add-Ons</p>
                                        <ExternalLink size={16} strokeWidth={1.5} />
                                      </div>
                                    </Link>
                                    <Link
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
                                    >
                                      <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                        <p className="text-sm m-0">Compute Billing</p>
                                        <ExternalLink size={16} strokeWidth={1.5} />
                                      </div>
                                    </Link>
                                  </div>
                                </div>
                              }
                              description={
                                <>
                                  <p>
                                    The size for your dedicated database. You can change this later.
                                  </p>
                                </>
                              }
                            >
                              <Select_Shadcn_
                                value={field.value}
                                onValueChange={(value) => field.onChange(value)}
                              >
                                <SelectTrigger_Shadcn_ className="[&_.instance-details]:hidden">
                                  <SelectValue_Shadcn_ placeholder="Select a compute size" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    {sizes
                                      .filter((option) =>
                                        instanceSizeSpecs[option].cloud_providers.includes(
                                          form.getValues('cloudProvider') as CloudProvider
                                        )
                                      )
                                      .map((option) => {
                                        return (
                                          <SelectItem_Shadcn_ key={option} value={option}>
                                            <div className="flex flex-row i gap-2">
                                              <div className="text-center w-[80px]">
                                                <Badge
                                                  variant={option === 'micro' ? 'default' : 'brand'}
                                                  className="rounded-md w-16 text-center flex justify-center font-mono uppercase"
                                                >
                                                  {instanceSizeSpecs[option].label}
                                                </Badge>
                                              </div>
                                              <div className="text-sm">
                                                <span className="text-foreground">
                                                  {instanceSizeSpecs[option].ram} RAM /{' '}
                                                  {instanceSizeSpecs[option].cpu}{' '}
                                                  {getCloudProviderArchitecture(
                                                    form.getValues('cloudProvider') as CloudProvider
                                                  )}{' '}
                                                  CPU
                                                </span>
                                                <p
                                                  className="text-xs text-muted instance-details"
                                                  translate="no"
                                                >
                                                  ${instanceSizeSpecs[option].priceHourly}/hour (~$
                                                  {instanceSizeSpecs[option].priceMonthly}/month)
                                                </p>
                                              </div>
                                            </div>
                                          </SelectItem_Shadcn_>
                                        )
                                      })}
                                  </SelectGroup_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </Panel.Content>
                    )}

                    <Panel.Content>
                      <FormField_Shadcn_
                        control={form.control}
                        name="dbPass"
                        render={({ field }) => {
                          const hasSpecialCharacters =
                            field.value.length > 0 && !field.value.match(SPECIAL_CHARS_REGEX)

                          return (
                            <FormItemLayout
                              label="Database Password"
                              layout="horizontal"
                              description={
                                <>
                                  {hasSpecialCharacters && <SpecialSymbolsCallout />}
                                  <PasswordStrengthBar
                                    passwordStrengthScore={form.getValues('dbPassStrength')}
                                    password={field.value}
                                    passwordStrengthMessage={passwordStrengthMessage}
                                    generateStrongPassword={generatePassword}
                                  />
                                </>
                              }
                            >
                              <FormControl_Shadcn_>
                                <Input
                                  copy={field.value.length > 0}
                                  type="password"
                                  placeholder="Type in a strong password"
                                  {...field}
                                  autoComplete="off"
                                  onChange={async (event) => {
                                    field.onChange(event)
                                    form.trigger('dbPassStrength')
                                    const value = event.target.value
                                    if (event.target.value === '') {
                                      await form.setValue('dbPassStrength', 0)
                                      await form.trigger('dbPass')
                                    } else {
                                      await delayedCheckPasswordStrength(value)
                                    }
                                  }}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )
                        }}
                      />
                    </Panel.Content>

                    <Panel.Content>
                      <FormField_Shadcn_
                        control={form.control}
                        name="dbRegion"
                        render={({ field }) => (
                          <RegionSelector
                            field={field}
                            form={form}
                            cloudProvider={form.getValues('cloudProvider') as CloudProvider}
                          />
                        )}
                      />
                    </Panel.Content>

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

                    {showNonProdFields && (
                      <Panel.Content>
                        <FormField_Shadcn_
                          control={form.control}
                          name="postgresVersion"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Custom Postgres version"
                              layout="horizontal"
                              description="Specify a custom version of Postgres (Defaults to the latest). This is only applicable for local/staging projects"
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  placeholder="Postgres version"
                                  {...field}
                                  autoComplete="off"
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </Panel.Content>
                    )}

                    <SecurityOptions form={form} />
                    {!!availableOrioleVersion && <AdvancedConfiguration form={form} />}
                  </>
                )}

                {freePlanWithExceedingLimits ? (
                  isAdmin &&
                  slug && (
                    <Panel.Content>
                      <FreeProjectLimitWarning
                        membersExceededLimit={membersExceededLimit || []}
                        orgSlug={slug}
                      />
                    </Panel.Content>
                  )
                ) : isManagedByVercel ? (
                  <Panel.Content>
                    <PartnerManagedResource
                      partner="vercel-marketplace"
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
                href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
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

/**
 * When launching new projects, they only get assigned a compute size once successfully launched,
 * this might assume wrong compute size, but only for projects being rapidly launched after one another on non-default compute sizes.
 *
 * Needs to be in the API in the future [kevin]
 */
const monthlyInstancePrice = (instance: string | undefined): number => {
  return instanceSizeSpecs[instance as DesiredInstanceSize]?.priceMonthly || 10
}

const instanceLabel = (instance: string | undefined): string => {
  return instanceSizeSpecs[instance as DesiredInstanceSize]?.label || 'Micro'
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
