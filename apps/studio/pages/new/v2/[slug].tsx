import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { components } from 'api-types'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { debounce } from 'lodash'
import { ChevronRight, ExternalLink, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'
import { z } from 'zod'

import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'
import { TelemetryActions } from 'common/telemetry-constants'
import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import { AdvancedConfiguration } from 'components/interfaces/ProjectCreation/AdvancedConfiguration'
import { InitialStep } from 'components/interfaces/ProjectCreation/InitialStep'
import {
  PostgresVersionSelector,
  extractPostgresVersionDetails,
} from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { SPECIAL_CHARS_REGEX } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { ProjectVisual } from 'components/interfaces/ProjectCreation/ProjectVisual'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { SchemaGenerator } from 'components/interfaces/ProjectCreation/SchemaGenerator'
import { SecurityOptions } from 'components/interfaces/ProjectCreation/SecurityOptions'
import { SpecialSymbolsCallout } from 'components/interfaces/ProjectCreation/SpecialSymbolsCallout'
import { FeedbackDropdown } from 'components/layouts/ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from 'components/layouts/ProjectLayout/LayoutHeader/HelpPopover'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { ScrollGradient } from 'components/ui/ScrollGradient'
import { useAvailableOrioleImageVersion } from 'data/config/project-creation-postgres-versions-query'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { instanceSizeSpecs } from 'data/projects/new-project.constants'
import {
  DbInstanceSize,
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import {
  AWS_REGIONS_DEFAULT,
  BASE_PATH,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  FLY_REGIONS_DEFAULT,
  PROJECT_STATUS,
  PROVIDERS,
} from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import type { CloudProvider } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
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
import { Admonition } from 'ui-patterns/admonition'
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
  sql: z.string().optional(),
})

export type CreateProjectForm = z.infer<typeof FormSchema>

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

interface SupabaseService {
  name: 'Auth' | 'Storage' | 'Database' | 'Edge Function' | 'Cron' | 'Queues' | 'Vector'
  reason: string
}

const WizardForm = () => {
  const router = useRouter()
  const { slug, projectName } = useParams()

  const [showAdvanced, setShowAdvanced] = useState<Boolean>(false)
  const [services, setServices] = useState<SupabaseService[]>([])
  const [sqlStatements, setSqlStatements] = useState<string[]>([])
  const [showVisual, setShowVisual] = useState(false)

  const [step, setStep] = useState(1)
  const [formTitle, setFormTitle] = useState('Create a new project')
  const [formDescription, setFormDescription] = useState(
    'Get started by choosing how you want to create your project'
  )

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const projectVersionSelectionDisabled = useFlag('disableProjectVersionSelection')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const allowOrioleDB = useFlag('allowOrioleDb')
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug })

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)

  const { data: orgSubscription } = useOrgSubscriptionQuery({ orgSlug: slug })

  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({
    enabled:
      orgSubscription !== undefined &&
      !['team', 'enterprise'].includes(orgSubscription?.plan.id ?? ''),
  })
  const overdueInvoices = (allOverdueInvoices ?? []).filter(
    (x) => x.organization_id === currentOrg?.id
  )
  const hasOutstandingInvoices = overdueInvoices.length > 0

  const { data: allProjects } = useProjectsQuery({})
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

  const { mutate: sendEvent } = useSendEventMutation()

  const isAdmin = useCheckPermissions(PermissionAction.CREATE, 'projects')
  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

  const freePlanWithExceedingLimits =
    orgSubscription?.plan?.id === 'free' && hasMembersExceedingFreeTierLimit

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
      sql: '',
    },
  })

  const { instanceSize, cloudProvider, dbRegion, organization } = form.watch()

  const availableOrioleVersion = useAvailableOrioleImageVersion({
    cloudProvider: cloudProvider as CloudProvider,
    dbRegion,
    organizationSlug: organization,
  })

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

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    // too important to cause disruption here, make sure to catch and skip any errors
    try {
      sendEvent({
        action: TelemetryActions.PROJECT_CREATION_SECOND_STEP_SUBMITTED,
      })
    } catch (error) {}

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
      sql,
    } = values

    if (useOrioleDb && !availableOrioleVersion) {
      return toast.error('No available OrioleDB image found, only Postgres is available')
    }

    const { postgresEngine, releaseChannel } =
      extractPostgresVersionDetails(postgresVersionSelection)

    const data: ProjectCreateVariables = {
      cloudProvider: cloudProvider,
      organizationId: currentOrg.id,
      name: projectName,
      dbPass: dbPass,
      dbRegion: dbRegion,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      dbSql: sql,
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize:
        orgSubscription?.plan.id === 'free' ? undefined : (instanceSize as DesiredInstanceSize),
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
    if (slug) form.setValue('organization', slug)
    if (projectName) form.setValue('projectName', projectName || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    // Redirect to first org if the slug doesn't match an org slug
    // this is mainly to capture the /new/new-project url, which is redirected from database.new
    if (isInvalidSlug && isOrganizationsSuccess && (organizations?.length ?? 0) > 0) {
      router.push(`/new/${organizations?.[0].slug}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvalidSlug, isOrganizationsSuccess, organizations])

  useEffect(() => {
    if (form.getValues('dbRegion') === undefined && defaultRegion) {
      form.setValue('dbRegion', defaultRegion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRegion])

  useEffect(() => {
    if (defaultRegionError) {
      form.setValue('dbRegion', PROVIDERS[DEFAULT_PROVIDER].default_region.displayName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRegionError])

  useEffect(() => {
    if (step === 1) {
      handleReset()
    }
  }, [step])

  const handleReset = () => {
    setSqlStatements([])
    setServices([])
  }

  const availableComputeCredits = organizationProjects.length === 0 ? 10 : 0

  const additionalMonthlySpend =
    instanceSizeSpecs[instanceSize as DbInstanceSize]!.priceMonthly - availableComputeCredits

  const selectedRegionObject = useMemo((): {
    name: string
    location: { latitude: number; longitude: number }
    code: string
    displayName: string
  } | null => {
    const dbRegion = form.getValues('dbRegion')
    const awsRegion = Object.entries(AWS_REGIONS).find(
      ([_, region]) => region.displayName === dbRegion
    )
    const flyRegion = Object.entries(FLY_REGIONS).find(
      ([_, region]) => region.displayName === dbRegion
    )

    const region = awsRegion || flyRegion
    if (region) {
      const [name, details] = region
      return {
        name,
        location: {
          latitude: details.location[0],
          longitude: details.location[1],
        },
        code: details.code,
        displayName: details.displayName,
      }
    }

    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getValues('dbRegion')])

  const projectCreateBlocked =
    projectCreationDisabled ||
    !isAdmin ||
    freePlanWithExceedingLimits ||
    isManagedByVercel ||
    hasOutstandingInvoices

  // set sql fields anytime the sqlStatements array changes
  useEffect(() => {
    form.setValue('sql', sqlStatements.join('\n\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqlStatements])

  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b p-3 border-default flex-0">
        <div className="Breadcrumbs flex justify-between">
          <div className="flex items-center text-sm">
            <div className="flex items-center space-x-2">
              <Link href="/projects">
                <img
                  src={`${BASE_PATH}/img/supabase-logo.svg`}
                  alt="Supabase"
                  className="rounded border p-1 hover:border-white border-default"
                  style={{ height: 24 }}
                />
              </Link>
              <ChevronRight size="18" className="text-foreground-light" strokeWidth={1} />
              <Button
                type="text"
                onClick={() => {
                  handleReset()
                  setStep(1)
                }}
                className={`text-sm ${step === 1 ? 'text-foreground' : 'text-foreground-light'}`}
              >
                Create a new project
              </Button>
              <ChevronRight size="18" className="text-foreground-light" strokeWidth={1} />
              <p className={`text-sm ${step !== 2 ? 'text-foreground-light' : ''}`}>
                Configure your database
              </p>
            </div>
          </div>
          <div className="flex">{/* The End */}</div>
          <div className="flex items-center space-x-2">
            <HelpPopover />
            <FeedbackDropdown />
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex flex-1 lg:flex-row flex-col items-start w-full overflow-auto"
      >
        <div className="w-full min-h-full lg:max-w-[600px] relative p-16 lg:p-24 lg:pr-0 lg:flex lg:items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 ? (
                <InitialStep
                  onSqlGenerated={(sql) => {
                    setSqlStatements((prev) => [...prev, sql])
                  }}
                  onServicesUpdated={setServices}
                  onTitleUpdated={(title) => {
                    if (!form.getValues('projectName')) {
                      form.setValue('projectName', title)
                    }
                  }}
                  onSubmit={(value) => {
                    setFormTitle('Create a project')
                    setFormDescription(
                      'We have generated a starting schema for you based on your description'
                    )
                    sendEvent({
                      action: TelemetryActions.PROJECT_CREATION_INITIAL_STEP_SUBMITTED,
                      properties: { onboardingPath: 'use_prompt' },
                    })
                    setStep(2)
                  }}
                  onStartBlank={() => {
                    setFormTitle('Start from Scratch')
                    setFormDescription('Configure your new blank project')
                    sendEvent({
                      action: TelemetryActions.PROJECT_CREATION_INITIAL_STEP_SUBMITTED,
                      properties: { onboardingPath: 'start_blank' },
                    })
                    setStep(2)
                  }}
                  onMigrate={() => {
                    setFormTitle('Migrate Existing Database')
                    setFormDescription(
                      'First we need to create a new project to migrate your database to'
                    )
                    sendEvent({
                      action: TelemetryActions.PROJECT_CREATION_INITIAL_STEP_SUBMITTED,
                      properties: { onboardingPath: 'migrate' },
                    })
                    setStep(2)
                  }}
                />
              ) : (
                <Form_Shadcn_ {...form}>
                  <form
                    id="project-create-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-full"
                  >
                    <section className="relative">
                      <div>
                        <div className="mb-2">
                          <h3>{formTitle}</h3>
                          <p className="text-sm text-foreground-lighter">{formDescription}</p>
                        </div>
                        <>
                          <div className="">
                            <div className="">
                              <div className="py-5 grid grid-cols-2 gap-2">
                                <FormField_Shadcn_
                                  control={form.control}
                                  name="organization"
                                  render={({ field }) => (
                                    <FormItemLayout label="Organization">
                                      {(organizations?.length ?? 0) > 0 && (
                                        <Select_Shadcn_
                                          onValueChange={(slug) => {
                                            field.onChange(slug)
                                            router.push(`/new/v2/${slug}`)
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
                                <div>
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="projectName"
                                    render={({ field }) => (
                                      <FormItemLayout label="Project name">
                                        <FormControl_Shadcn_>
                                          <Input_Shadcn_
                                            autoFocus
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
                                </div>
                              </div>
                              {projectCreationDisabled ? (
                                <div className="pb-8">
                                  <DisabledWarningDueToIncident title="Project creation is currently disabled" />
                                </div>
                              ) : !isAdmin ? (
                                <div className="pb-5 -mt-5">
                                  <NotOrganizationOwnerWarning />
                                </div>
                              ) : freePlanWithExceedingLimits ? (
                                isAdmin &&
                                slug && (
                                  <div className="py-5 -mt-5">
                                    <FreeProjectLimitWarning
                                      membersExceededLimit={membersExceededLimit || []}
                                      orgSlug={slug}
                                    />
                                  </div>
                                )
                              ) : isManagedByVercel ? (
                                <div className="py-5 -mt-5">
                                  <PartnerManagedResource
                                    partner="vercel-marketplace"
                                    resource="Projects"
                                    cta={{
                                      installationId: currentOrg?.partner_id,
                                      message: 'Visit Vercel to create a project',
                                    }}
                                  />
                                </div>
                              ) : (
                                hasOutstandingInvoices && (
                                  <div className="py-5 -mt-5">
                                    <Admonition
                                      type="default"
                                      title="Your organization has overdue invoices"
                                      description={
                                        <div className="space-y-3">
                                          <p className="text-sm leading-normal">
                                            Please resolve all outstanding invoices first before
                                            creating a new project
                                          </p>

                                          <div>
                                            <Button asChild type="default">
                                              <Link href={`/org/${slug}/invoices`}>
                                                View invoices
                                              </Link>
                                            </Button>
                                          </div>
                                        </div>
                                      }
                                    />
                                  </div>
                                )
                              )}
                              <div
                                className={
                                  projectCreateBlocked ? 'opacity-25 pointer-events-none' : ''
                                }
                              >
                                <div className="py-5 border-b border-t">
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="dbRegion"
                                    render={({ field }) => (
                                      <RegionSelector
                                        layout="vertical"
                                        field={field}
                                        form={form}
                                        cloudProvider={
                                          form.getValues('cloudProvider') as CloudProvider
                                        }
                                      />
                                    )}
                                  />
                                </div>
                                <div className="py-5">
                                  <FormField_Shadcn_
                                    control={form.control}
                                    name="dbPass"
                                    render={({ field }) => {
                                      const hasSpecialCharacters =
                                        field.value.length > 0 &&
                                        !field.value.match(SPECIAL_CHARS_REGEX)

                                      return (
                                        <FormItemLayout
                                          label="Database Password"
                                          description={
                                            <>
                                              {hasSpecialCharacters && <SpecialSymbolsCallout />}
                                              <PasswordStrengthBar
                                                passwordStrengthScore={form.getValues(
                                                  'dbPassStrength'
                                                )}
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
                                </div>
                                <div className="py-5 border-t border-b">
                                  <FormItemLayout>
                                    <SchemaGenerator
                                      step="second"
                                      onReset={handleReset}
                                      onSqlGenerated={(sql) => {
                                        setSqlStatements((prev) => [...prev, sql])
                                      }}
                                      onServicesUpdated={setServices}
                                      onTitleUpdated={(title) => {
                                        if (!form.getValues('projectName')) {
                                          form.setValue('projectName', title)
                                        }
                                      }}
                                    />
                                  </FormItemLayout>
                                  {sqlStatements.length > 0 && (
                                    <Button
                                      type="default"
                                      className="w-full mt-2 lg:hidden"
                                      onClick={() => setShowVisual(!showVisual)}
                                    >
                                      View the schema
                                    </Button>
                                  )}
                                </div>
                                {orgSubscription?.plan && orgSubscription?.plan.id !== 'free' && (
                                  <div className="py-5 border-b">
                                    <FormField_Shadcn_
                                      control={form.control}
                                      name="instanceSize"
                                      render={({ field }) => (
                                        <FormItemLayout
                                          label={
                                            <div className="flex gap-4 w-full justify-between group:block">
                                              <span className="flex-1">Compute Size</span>
                                            </div>
                                          }
                                          description={
                                            <div className="flex flex gap-2">
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
                                                    instanceSizeSpecs[
                                                      option
                                                    ].cloud_providers.includes(
                                                      form.getValues(
                                                        'cloudProvider'
                                                      ) as CloudProvider
                                                    )
                                                  )
                                                  .map((option) => {
                                                    return (
                                                      <SelectItem_Shadcn_
                                                        key={option}
                                                        value={option}
                                                      >
                                                        <div className="flex flex-row i gap-2">
                                                          <div className="text-center w-[80px]">
                                                            <Badge
                                                              variant={
                                                                option === 'micro'
                                                                  ? 'default'
                                                                  : 'brand'
                                                              }
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
                                                                form.getValues(
                                                                  'cloudProvider'
                                                                ) as CloudProvider
                                                              )}{' '}
                                                              CPU
                                                            </span>
                                                            <p className="text-xs text-muted instance-details">
                                                              $
                                                              {
                                                                instanceSizeSpecs[option]
                                                                  .priceHourly
                                                              }
                                                              /hour (~$
                                                              {
                                                                instanceSizeSpecs[option]
                                                                  .priceMonthly
                                                              }
                                                              /month)
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

                                    <FormItemLayout>
                                      <div className="flex justify-between mr-2 mt-4">
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
                                                  <TableHead className="w-[170px]">
                                                    Project
                                                  </TableHead>
                                                  <TableHead>Compute Size</TableHead>
                                                  <TableHead className="text-right">
                                                    Monthly Costs
                                                  </TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody className="[&_td]:py-2">
                                                {organizationProjects.map((project) => (
                                                  <TableRow
                                                    key={project.ref}
                                                    className="text-foreground-light"
                                                  >
                                                    <TableCell className="w-[170px] truncate">
                                                      {project.name}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                      {instanceLabel(project.infra_compute_size)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                      $
                                                      {monthlyInstancePrice(
                                                        project.infra_compute_size
                                                      )}
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

                                            <div className="p-4 text-xs text-foreground-light space-y-1">
                                              <p>
                                                Compute is charged usage-based whenever your billing
                                                cycle resets. Given compute charges are hourly, your
                                                invoice will contain "Compute Hours" for each hour a
                                                project ran on a specific compute size.
                                              </p>
                                              {monthlyComputeCosts > 0 && (
                                                <p>
                                                  Compute costs are applied on top of your
                                                  subscription plan costs.
                                                </p>
                                              )}
                                            </div>
                                          </InfoTooltip>
                                        </div>
                                      </div>

                                      <div className="mt-2 text-foreground-lighter space-y-1">
                                        {additionalMonthlySpend > 0 &&
                                        availableComputeCredits === 0 ? (
                                          <p>
                                            Your monthly spend will increase, and can be more than
                                            above if you exceed your plan's usage quota. Your
                                            organization includes $10/month of compute credits,
                                            which you already exceed with your existing projects.
                                          </p>
                                        ) : additionalMonthlySpend > 0 &&
                                          availableComputeCredits > 0 ? (
                                          <p>
                                            Your monthly spend will increase, and can be more than
                                            above if you exceed your plan's usage quota. Your
                                            organization includes $10/month of compute credits,
                                            which you exceed with the selected compute size.
                                          </p>
                                        ) : (
                                          <p>
                                            Your monthly spend won't increase, unless you exceed
                                            your plan's usage quota. Your organization includes
                                            $10/month of compute credits, which cover this project.
                                          </p>
                                        )}
                                      </div>
                                    </FormItemLayout>
                                  </div>
                                )}
                                <div>
                                  {!showAdvanced && (
                                    <Button
                                      onClick={() => setShowAdvanced(true)}
                                      icon={<Settings size={16} />}
                                      type="outline"
                                      className="w-full mb-2 mt-4"
                                    >
                                      Advanced Configuration
                                    </Button>
                                  )}
                                  <div className={cn(showAdvanced ? 'block' : 'hidden')}>
                                    {cloudProviderEnabled && showNonProdFields && (
                                      <div className="py-5 border-b">
                                        <FormField_Shadcn_
                                          control={form.control}
                                          name="cloudProvider"
                                          render={({ field }) => (
                                            <FormItemLayout label="Cloud provider">
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
                                                        <SelectItem_Shadcn_
                                                          key={value}
                                                          value={value}
                                                        >
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
                                      </div>
                                    )}

                                    {!projectVersionSelectionDisabled && (
                                      <div className="py-5 border-b">
                                        <FormField_Shadcn_
                                          control={form.control}
                                          name="postgresVersionSelection"
                                          render={({ field }) => (
                                            <PostgresVersionSelector
                                              layout="vertical"
                                              field={field}
                                              form={form}
                                              cloudProvider={
                                                form.getValues('cloudProvider') as CloudProvider
                                              }
                                              organizationSlug={slug}
                                              dbRegion={form.getValues('dbRegion')}
                                            />
                                          )}
                                        />
                                      </div>
                                    )}

                                    {showNonProdFields && (
                                      <div className="py-5 border-b">
                                        <FormField_Shadcn_
                                          control={form.control}
                                          name="postgresVersion"
                                          render={({ field }) => (
                                            <FormItemLayout
                                              label="Custom Postgres version"
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
                                      </div>
                                    )}
                                    <div className="py-4 border-b mb-4">
                                      <SecurityOptions
                                        layout="vertical"
                                        collapsible={false}
                                        form={form}
                                      />
                                    </div>
                                    {allowOrioleDB && !!availableOrioleVersion && (
                                      <div className="py-4 border-b mb-4">
                                        <AdvancedConfiguration
                                          layout="vertical"
                                          collapsible={false}
                                          form={form}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="sticky bottom-0 z-20 bg-background-200 pb-6">
                                <ScrollGradient offset={60} scrollRef={scrollRef} />
                                <Button
                                  form="project-create-form"
                                  htmlType="submit"
                                  size="large"
                                  className="w-full"
                                  loading={isCreatingNewProject}
                                  disabled={
                                    !canCreateProject ||
                                    isCreatingNewProject ||
                                    projectCreateBlocked
                                  }
                                >
                                  {isCreatingNewProject ? 'Creating project...' : 'Create project'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      </div>
                    </section>
                  </form>
                </Form_Shadcn_>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <section
          className={cn(
            'bg-background-200 lg:bg-transparent lg:z-10 lg:flex-1 flex-0 shrink-0 w-full overflow-hidden h-full',
            // Mobile styles
            'lg:sticky lg:top-0', // Always relative on desktop
            showVisual ? 'fixed inset-0 z-40' : 'hidden lg:block' // Toggle visibility on mobile
          )}
        >
          <ProjectVisual
            showInfo={step === 2}
            sqlStatements={sqlStatements}
            services={services}
            selectedRegion={selectedRegionObject}
            projectDetails={{
              dbRegion: form.getValues('dbRegion'),
              cloudProvider: form.getValues('cloudProvider'),
              postgresVersion: form.getValues('postgresVersionSelection'),
            }}
          />

          {/* Add close button when showing visual on mobile */}
          {showVisual && (
            <Button
              type="default"
              className="absolute top-4 left-4 lg:hidden"
              onClick={() => setShowVisual(false)}
            >
              Back
            </Button>
          )}
        </section>
      </div>
    </div>
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

const Wizard: NextPageWithLayout = () => {
  const { slug } = useParams()
  const { isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const { isLoading: isLoadingFreeProjectLimitCheck } = useFreeProjectLimitCheckQuery({ slug })

  if (!isOrganizationsSuccess || isLoadingFreeProjectLimitCheck) return null

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <WizardForm />
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default withAuth(Wizard)
