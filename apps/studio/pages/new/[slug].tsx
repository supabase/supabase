import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
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
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import generator from 'generate-password-browser'
import { useCheckPermissions, useFlag, withAuth } from 'hooks'
import {
  CloudProvider,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  PROVIDERS,
} from 'lib/constants'
import { passwordStrength } from 'lib/helpers'
import { debounce } from 'lodash'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
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
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

type DesiredInstanceSize = components['schemas']['DesiredInstanceSize']

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug } = useParams()

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const { data: membersExceededLimit, isLoading: isLoadingFreeProjectLimitCheck } =
    useFreeProjectLimitCheckQuery({ slug })

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)
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

  const canCreateProject = isAdmin && !freePlanWithExceedingLimits

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
    { label: string; ram: string; cpu: string; price: string }
  > = {
    micro: {
      label: 'Micro',
      ram: '1 GB',
      cpu: '2-core ARM',
      price: '$0.01344/hour (~$10/month)',
    },
    small: {
      label: 'Small',
      ram: '2 GB',
      cpu: '2-core ARM',
      price: '$0.0206/hour (~$15/month)',
    },
    medium: {
      label: 'Medium',
      ram: '4 GB',
      cpu: '2-core ARM',
      price: '$0.0822/hour (~$60/month)',
    },
    large: {
      label: 'Large',
      ram: '8 GB',
      cpu: '2-core ARM',
      price: '$0.1517/hour (~$110/month)',
    },
    xlarge: {
      label: 'XL',
      ram: '16 GB',
      cpu: '4-core ARM',
      price: '$0.2877/hour (~$210/month)',
    },
    '2xlarge': {
      label: '2XL',
      ram: '32 GB',
      cpu: '8-core ARM',
      price: '$0.562/hour (~$410/month)',
    },
    '4xlarge': {
      label: '4XL',
      ram: '64 GB',
      cpu: '16-core ARM',
      price: '$1.32/hour (~$960/month)',
    },
    '8xlarge': {
      label: '8XL',
      ram: '128 GB',
      cpu: '32-core ARM',
      price: '$2.562/hour (~$1,870/month)',
    },
    '12xlarge': {
      label: '12XL',
      ram: '192 GB',
      cpu: '48-core ARM',
      price: '$3.836/hour (~$2,800/month)',
    },
    '16xlarge': {
      label: '16XL',
      ram: '256 GB',
      cpu: '64-core ARM',
      price: '$5.12/hour (~$3,730/month)',
    },
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
      projectName: '',
      postgresVersion: '',
      cloudProvider: PROVIDERS[DEFAULT_PROVIDER].id,
      dbPass: '',
      dbPassStrength: 0,
      dbRegion: defaultRegion || undefined,
      instanceSize: sizes[0],
    },
  })

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

  const onClickNext = async (values: z.infer<typeof FormSchema>) => {
    if (!currentOrg) return console.error('Unable to retrieve current organization')

    const { cloudProvider, projectName, dbPass, dbRegion, postgresVersion, instanceSize } = values

    const data: ProjectCreateVariables = {
      cloudProvider: cloudProvider,
      organizationId: currentOrg.id,
      name: projectName,
      dbPass: dbPass,
      dbRegion: dbRegion,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the instance size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize:
        orgSubscription?.plan.id === 'free' ? undefined : (instanceSize as DesiredInstanceSize),
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
      form.setValue('dbRegion', PROVIDERS[DEFAULT_PROVIDER].default_region)
    }
  }, [defaultRegionError])

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onClickNext)}>
        <Panel
          loading={!isOrganizationsSuccess || isLoadingFreeProjectLimitCheck}
          title={
            <div key="panel-title">
              <h3>Create a new project</h3>
              <p className="text-sm text-foreground-lighter">
                Your project will have its own dedicated instance and full postgres database.
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
                  disabled={isCreatingNewProject || isSuccessNewProject}
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
                                onValueChange={field.onChange}
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
                                  <span>Instance Size</span>

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

                                    <Link
                                      href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
                                      target="_blank"
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
                                    Select the size for your dedicated database. You can always
                                    change this later.
                                  </p>
                                  <p className="mt-1">
                                    Your organization has $10/month in Compute Credits to cover one
                                    instance on Micro Compute or parts of any other instance size.
                                  </p>
                                </>
                              }
                            >
                              <Select_Shadcn_
                                value={field.value}
                                onValueChange={(value) => field.onChange(value)}
                              >
                                <SelectTrigger_Shadcn_ className="[&_.instance-details]:hidden">
                                  <SelectValue_Shadcn_ placeholder="Select an instance size" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    {sizes.map((option) => {
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
                                                {instanceSizeSpecs[option].cpu} CPU
                                              </span>
                                              <p className="text-xs text-muted instance-details">
                                                {instanceSizeSpecs[option].price}
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
                        render={({ field }) => (
                          <FormItemLayout
                            label="Database Password"
                            layout="horizontal"
                            description={
                              <>
                                <PasswordStrengthBar
                                  passwordStrengthScore={form.getValues('dbPassStrength')}
                                  password={field.value}
                                  passwordStrengthMessage={passwordStrengthMessage}
                                  generateStrongPassword={generateStrongPassword}
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
              </div>
            )}
          </>
        </Panel>
      </form>
    </Form_Shadcn_>
  )
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
