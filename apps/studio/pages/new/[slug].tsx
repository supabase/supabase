import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import generator from 'generate-password-browser'
import { debounce } from 'lodash'
import { ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import { components } from 'api-types'
import { useParams } from 'common'
import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import Panel from 'components/ui/Panel'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  DbInstanceSize,
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
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
import type { CloudProvider } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import {
  Admonition,
  Badge,
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

type DesiredInstanceSize = components['schemas']['DesiredInstanceSize']

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

const instanceSizeSpecs: Record<
  DesiredInstanceSize,
  {
    label: string
    ram: string
    cpu: string
    priceHourly: number
    priceMonthly: number
    cloud_providers: string[]
  }
> = {
  micro: {
    label: 'Micro',
    ram: '1 GB',
    cpu: '2-core',
    priceHourly: 0.01344,
    priceMonthly: 10,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  small: {
    label: 'Small',
    ram: '2 GB',
    cpu: '2-core',
    priceHourly: 0.0206,
    priceMonthly: 15,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  medium: {
    label: 'Medium',
    ram: '4 GB',
    cpu: '2-core',
    priceHourly: 0.0822,
    priceMonthly: 60,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  large: {
    label: 'Large',
    ram: '8 GB',
    cpu: '2-core',
    priceHourly: 0.1517,
    priceMonthly: 110,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  xlarge: {
    label: 'XL',
    ram: '16 GB',
    cpu: '4-core',
    priceHourly: 0.2877,
    priceMonthly: 210,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  '2xlarge': {
    label: '2XL',
    ram: '32 GB',
    cpu: '8-core',
    priceHourly: 0.562,
    priceMonthly: 410,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  '4xlarge': {
    label: '4XL',
    ram: '64 GB',
    cpu: '16-core',
    priceHourly: 1.32,
    priceMonthly: 960,
    cloud_providers: [PROVIDERS.AWS.id, PROVIDERS.FLY.id],
  },
  '8xlarge': {
    label: '8XL',
    ram: '128 GB',
    cpu: '32-core',
    priceHourly: 2.562,
    priceMonthly: 1870,
    cloud_providers: [PROVIDERS.AWS.id],
  },
  '12xlarge': {
    label: '12XL',
    ram: '192 GB',
    cpu: '48-core',
    priceHourly: 3.836,
    priceMonthly: 2800,
    cloud_providers: [PROVIDERS.AWS.id],
  },
  '16xlarge': {
    label: '16XL',
    ram: '256 GB',
    cpu: '64-core',
    priceHourly: 5.12,
    priceMonthly: 3730,
    cloud_providers: [PROVIDERS.AWS.id],
  },
}

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug, projectName } = useParams()

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const { data: membersExceededLimit, isLoading: isLoadingFreeProjectLimitCheck } =
    useFreeProjectLimitCheckQuery({ slug })

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)

  const { data: allProjects } = useProjectsQuery({})
  const organizationProjects =
    allProjects?.filter(
      (project) =>
        project.organization_id === currentOrg?.id && project.status !== PROJECT_STATUS.INACTIVE
    ) ?? []

  const { data: orgSubscription } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })
  const { data: defaultRegion, error: defaultRegionError } = useDefaultRegionQuery(
    {
      cloudProvider: PROVIDERS[DEFAULT_PROVIDER].id,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    }
  )

  const {
    mutate: createProject,
    isLoading: isCreatingNewProject,
    isSuccess: isSuccessNewProject,
  } = useProjectCreateMutation({
    onSuccess: (res) => {
      router.push(`/project/${res.ref}/building`)
    },
  })

  const isAdmin = useCheckPermissions(PermissionAction.CREATE, 'projects')
  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

  const freePlanWithExceedingLimits =
    orgSubscription?.plan?.id === 'free' && hasMembersExceedingFreeTierLimit

  const isManagedByVercel = currentOrg?.managed_by === 'vercel-marketplace'

  const canCreateProject = isAdmin && !freePlanWithExceedingLimits && !isManagedByVercel

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

  const FormSchema = z
    .object({
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
        .string({
          required_error: 'Please enter a database password.',
        })
        .min(1, 'Password is required.'),
      instanceSize: z.string(),
      dataApi: z.boolean(),
      useApiSchema: z.boolean(),
    })
    .superRefine(({ dbPassStrength }, refinementContext) => {
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
    },
  })

  const { instanceSize } = form.watch()

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

  // [Joshen] Refactor: DB Password could be a common component
  // used in multiple pages with repeated logic
  function generateStrongPassword() {
    const password = generator.generate({
      length: 16,
      numbers: true,
      uppercase: true,
    })

    form.setValue('dbPass', password)
    delayedCheckPasswordStrength(password)
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
    } = values

    const data: ProjectCreateVariables = {
      cloudProvider: cloudProvider,
      organizationId: currentOrg.id,
      name: projectName,
      dbPass: dbPass,
      dbRegion: dbRegion,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize:
        orgSubscription?.plan.id === 'free' ? undefined : (instanceSize as DesiredInstanceSize),
      dataApiExposedSchemas: !dataApi ? [] : undefined,
      dataApiUseApiSchema: !dataApi ? false : useApiSchema,
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
    if (slug) form.setValue('organization', slug)
    if (projectName) form.setValue('projectName', projectName || '')
  }, [slug])

  useEffect(() => {
    // Redirect to first org if the slug doesn't match an org slug
    // this is mainly to capture the /new/new-project url, which is redirected from database.new
    if (isInvalidSlug && isOrganizationsSuccess && (organizations?.length ?? 0) > 0) {
      router.push(`/new/${organizations?.[0].slug}`)
    }
  }, [isInvalidSlug, isOrganizationsSuccess, organizations])

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

  const additionalMonthlySpend =
    instanceSizeSpecs[instanceSize as DbInstanceSize]!.priceMonthly - availableComputeCredits

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Panel
          loading={!isOrganizationsSuccess || isLoadingFreeProjectLimitCheck}
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
            <div key="panel-footer" className="flex items-center justify-between w-full">
              <Button
                type="default"
                disabled={isCreatingNewProject || isSuccessNewProject}
                onClick={() => router.push('/projects')}
              >
                Cancel
              </Button>
              <div className="items-center space-x-3">
                {!projectCreationDisabled && (
                  <span className="text-xs text-foreground-lighter">
                    You can rename your project later
                  </span>
                )}
                <Button
                  htmlType="submit"
                  loading={isCreatingNewProject || isSuccessNewProject}
                  disabled={isCreatingNewProject || isSuccessNewProject || isManagedByVercel}
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
                            defaultValue={field.value}
                          >
                            <FormControl_Shadcn_>
                              <SelectTrigger_Shadcn_>
                                <SelectValue_Shadcn_ placeholder="Select an organization" />
                              </SelectTrigger_Shadcn_>
                            </FormControl_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectGroup_Shadcn_>
                                {organizations?.map((x: any) => (
                                  <SelectItem_Shadcn_ key={x.id} value={x.slug}>
                                    {x.name}
                                  </SelectItem_Shadcn_>
                                ))}
                              </SelectGroup_Shadcn_>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        )}
                      </FormItemLayout>
                    )}
                  />

                  {!isAdmin && <NotOrganizationOwnerWarning />}
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
                              <Input_Shadcn_
                                placeholder="Project name"
                                {...field}
                                onChange={(event) => {
                                  field.onChange(event.target.value.replace(/\./g, ''))
                                }}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </Panel.Content>

                    {showNonProdFields && (
                      <Panel.Content>
                        <FormField_Shadcn_
                          control={form.control}
                          name="postgresVersion"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Postgres version"
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

                    {orgSubscription?.plan && orgSubscription?.plan.id !== 'free' && (
                      <Panel.Content>
                        <FormField_Shadcn_
                          control={form.control}
                          name="instanceSize"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="horizontal"
                              label={
                                <div className="space-y-4">
                                  <span>Compute Size</span>

                                  <div className="flex flex-col space-y-2">
                                    <Link
                                      href="https://supabase.com/docs/guides/platform/compute-add-ons"
                                      target="_blank"
                                    >
                                      <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                        <p className="text-sm m-0">Compute Add-Ons</p>
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
                                                <p className="text-xs text-muted instance-details">
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
                        <FormItemLayout
                          className="pt-4"
                          label={
                            <div className="space-y-4">
                              <span>Compute Billing</span>
                              <div className="flex flex-col space-y-2">
                                <Link
                                  href="https://supabase.com/docs/guides/platform/org-based-billing#billing-for-compute-compute-hours"
                                  target="_blank"
                                >
                                  <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                    <p className="text-sm m-0">Docs</p>
                                    <ExternalLink size={16} strokeWidth={1.5} />
                                  </div>
                                </Link>
                              </div>
                            </div>
                          }
                          layout="horizontal"
                        >
                          <div className="flex justify-between mr-2">
                            <span>Additional Monthly Compute Costs</span>
                            <div className="text-brand flex gap-1 items-center">
                              {organizationProjects.length > 0 ? (
                                <>
                                  <span>${additionalMonthlySpend}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-foreground-lighter line-through">
                                    $
                                    {
                                      instanceSizeSpecs[instanceSize as DbInstanceSize]!
                                        .priceMonthly
                                    }
                                  </span>
                                  <span>${additionalMonthlySpend}</span>
                                </>
                              )}
                              <InfoTooltip side="top" className="max-w-[450px] p-0">
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
                                <Table className="mt-3">
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
                                         *
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

                                <div className="p-4 text-xs text-foreground-light mt-2 space-y-1">
                                  <p>
                                    Compute is charged usage-based whenever your billing cycle
                                    resets. Given compute charges are hourly, your invoice will
                                    contain "Compute Hours" for each hour a project ran on a
                                    specific compute size.
                                  </p>
                                  {monthlyComputeCosts > 0 && (
                                    <p>
                                      Compute costs are applied on top of your subscription plan
                                      costs.
                                    </p>
                                  )}
                                </div>
                              </InfoTooltip>
                            </div>
                          </div>

                          <div className="mt-2 text-foreground-lighter space-y-1">
                            {additionalMonthlySpend > 0 && availableComputeCredits === 0 ? (
                              <p>
                                Your monthly spend will increase, and can be more than above if you
                                exceed your plan's usage quota. Your organization includes $10/month
                                of compute credits, which you already exceed with your existing
                                projects.
                              </p>
                            ) : additionalMonthlySpend > 0 && availableComputeCredits > 0 ? (
                              <p>
                                Your monthly spend will increase, and can be more than above if you
                                exceed your plan's usage quota. Your organization includes $10/month
                                of compute credits, which you exceed with the selected compute size.
                              </p>
                            ) : (
                              <p>
                                Your monthly spend won't increase, unless you exceed your plan's
                                usage quota. Your organization includes $10/month of compute
                                credits, which cover this project.
                              </p>
                            )}
                          </div>
                        </FormItemLayout>
                      </Panel.Content>
                    )}

                    <Panel.Content>
                      <FormField_Shadcn_
                        control={form.control}
                        name="dbPass"
                        render={({ field }) => (
                          <FormItemLayout
                            label="Database Password"
                            layout="horizontal"
                            description={
                              <PasswordStrengthBar
                                passwordStrengthScore={form.getValues('dbPassStrength')}
                                password={field.value}
                                passwordStrengthMessage={passwordStrengthMessage}
                                generateStrongPassword={generateStrongPassword}
                              />
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
                        )}
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

                    <Panel.Content>
                      <Collapsible_Shadcn_>
                        <CollapsibleTrigger_Shadcn_ className="group/advanced-trigger font-mono uppercase tracking-widest text-xs flex items-center gap-1 text-foreground-lighter/75 hover:text-foreground-light transition data-[state=open]:text-foreground-light">
                          Security options
                          <ChevronRight
                            size={16}
                            strokeWidth={1}
                            className="mr-2 group-data-[state=open]/advanced-trigger:rotate-90 group-hover/advanced-trigger:text-foreground-light transition"
                          />
                        </CollapsibleTrigger_Shadcn_>
                        <CollapsibleContent_Shadcn_
                          className={cn(
                            'pt-5 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
                          )}
                        >
                          <FormField_Shadcn_
                            name="dataApi"
                            control={form.control}
                            render={({ field }) => (
                              <>
                                <FormItemLayout
                                  layout="horizontal"
                                  label="What connections do you plan to use?"
                                >
                                  <FormControl_Shadcn_>
                                    <RadioGroupStacked
                                      // Due to radio group not supporting boolean values
                                      // value is converted to boolean
                                      onValueChange={(value) => field.onChange(value === 'true')}
                                      defaultValue={field.value.toString()}
                                    >
                                      <FormItem_Shadcn_ asChild>
                                        <FormControl_Shadcn_>
                                          <RadioGroupStackedItem
                                            value="true"
                                            className="[&>div>div>p]:text-left"
                                            label="Data API + Connection String"
                                            description="Connect to Postgres via autogenerated HTTP APIs or the Postgres protocol"
                                          />
                                        </FormControl_Shadcn_>
                                      </FormItem_Shadcn_>
                                      <FormItem_Shadcn_ asChild>
                                        <FormControl_Shadcn_>
                                          <RadioGroupStackedItem
                                            label="Only Connection String"
                                            value="false"
                                            description="Use Postgres without the autogenerated APIs"
                                            className={cn(
                                              !form.getValues('dataApi') && '!rounded-b-none'
                                            )}
                                          />
                                        </FormControl_Shadcn_>
                                      </FormItem_Shadcn_>
                                    </RadioGroupStacked>
                                  </FormControl_Shadcn_>
                                  {!form.getValues('dataApi') && (
                                    <Admonition
                                      className="rounded-t-none"
                                      type="warning"
                                      title="Data API will effectively be disabled"
                                    >
                                      PostgREST which powers the Data API will have no schemas
                                      available to it.
                                    </Admonition>
                                  )}
                                </FormItemLayout>
                              </>
                            )}
                          />

                          {form.getValues('dataApi') && (
                            <FormField_Shadcn_
                              name="useApiSchema"
                              control={form.control}
                              render={({ field }) => (
                                <>
                                  <FormItemLayout
                                    className="mt-6"
                                    layout="horizontal"
                                    label="Data API Configuration"
                                  >
                                    <FormControl_Shadcn_>
                                      <RadioGroupStacked
                                        defaultValue={field.value.toString()}
                                        onValueChange={(value) => field.onChange(value === 'true')}
                                      >
                                        <FormItem_Shadcn_ asChild>
                                          <FormControl_Shadcn_>
                                            <RadioGroupStackedItem
                                              value="false"
                                              // @ts-ignore
                                              label={
                                                <>
                                                  Use public schema for Data API
                                                  <Badge color="scale" className="ml-2">
                                                    Default
                                                  </Badge>
                                                </>
                                              }
                                              // @ts-ignore
                                              description={
                                                <>
                                                  Query all tables in the{' '}
                                                  <code className="text-xs">public</code> schema
                                                </>
                                              }
                                            />
                                          </FormControl_Shadcn_>
                                        </FormItem_Shadcn_>
                                        <FormItem_Shadcn_ asChild>
                                          <FormControl_Shadcn_>
                                            <RadioGroupStackedItem
                                              value="true"
                                              label="Use dedicated API schema for Data API"
                                              // @ts-ignore
                                              description={
                                                <>
                                                  Query allowlisted tables in a dedicated{' '}
                                                  <code className="text-xs">api</code> schema
                                                </>
                                              }
                                            />
                                          </FormControl_Shadcn_>
                                        </FormItem_Shadcn_>
                                      </RadioGroupStacked>
                                    </FormControl_Shadcn_>
                                  </FormItemLayout>
                                </>
                              )}
                            />
                          )}
                          <p className="text-xs text-foreground-lighter text-right mt-3">
                            These settings can be changed after the project is created via the
                            project's settings
                          </p>
                        </CollapsibleContent_Shadcn_>
                      </Collapsible_Shadcn_>
                    </Panel.Content>
                  </>
                )}

                {isAdmin && freePlanWithExceedingLimits && slug && (
                  <Panel.Content>
                    <FreeProjectLimitWarning
                      membersExceededLimit={membersExceededLimit || []}
                      orgSlug={slug}
                    />
                  </Panel.Content>
                )}

                {!freePlanWithExceedingLimits && isManagedByVercel && (
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
                )}
              </div>
            )}
          </>
        </Panel>
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
  return instanceSizeSpecs[instance as DbInstanceSize]?.priceMonthly || 10
}

const instanceLabel = (instance: string | undefined): string => {
  return instanceSizeSpecs[instance as DbInstanceSize]?.label || 'Micro'
}

const PageLayout = withAuth(({ children }: PropsWithChildren) => {
  const { slug } = useParams()

  const { data: organizations } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o) => o.slug === slug)

  return (
    <WizardLayoutWithoutAuth organization={currentOrg} project={null}>
      {children}
    </WizardLayoutWithoutAuth>
  )
})

Wizard.getLayout = (page) => <PageLayout>{page}</PageLayout>

export default Wizard
