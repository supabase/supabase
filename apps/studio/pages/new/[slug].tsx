import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import generator from 'generate-password-browser'
import { debounce } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Badge, Button, IconExternalLink, IconUsers, Input, Listbox } from 'ui'

import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import type { components } from 'data/api'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  DbInstanceSize,
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useFlag, withAuth } from 'hooks'
import {
  AWS_REGIONS,
  CloudProvider,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  FLY_REGIONS,
  PROVIDERS,
  Region,
} from 'lib/constants'
import { passwordStrength, pluckObjectFields } from 'lib/helpers'
import type { NextPageWithLayout } from 'types'

type DesiredInstanceSize = components['schemas']['DesiredInstanceSize']

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug } = useParams()

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const { data: membersExceededLimit, isLoading: isLoadingFreeProjectLimitCheck } =
    useFreeProjectLimitCheckQuery({ slug })

  const [projectName, setProjectName] = useState('')
  const [postgresVersion, setPostgresVersion] = useState('')
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>(PROVIDERS[DEFAULT_PROVIDER].id)

  const [dbPass, setDbPass] = useState('')
  // Auto select region on staging/local for convenience as there's only one supported
  const [dbRegion, setDbRegion] = useState(
    ['staging', 'local'].includes(process.env.NEXT_PUBLIC_ENVIRONMENT ?? '')
      ? PROVIDERS[cloudProvider].default_region
      : ''
  )
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)

  const [instanceSize, setInstanceSize] = useState<DbInstanceSize>('micro')

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)

  const { data: orgSubscription } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })

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

  const canSubmit =
    projectName !== '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion !== undefined

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  useEffect(() => {
    /*
     * Handle no org
     * redirect to new org route
     */
    if (isEmptyOrganizations) {
      router.push(`/new`)
    }
  }, [isEmptyOrganizations, router])

  useEffect(() => {
    /*
     * Redirect to first org if the slug doesn't match an org slug
     * this is mainly to capture the /new/new-project url, which is redirected from database.new
     */
    if (isInvalidSlug && (organizations?.length ?? 0) > 0) {
      router.push(`/new/${organizations?.[0].slug}`)
    }
  }, [isInvalidSlug, organizations])

  useEffect(() => {
    // User added a new payment method
    if (router.query.setup_intent && router.query.redirect_status) {
      toast.success('Successfully added new payment method')
    }
  }, [router.query.redirect_status, router.query.setup_intent])

  function onProjectNameChange(e: any) {
    e.target.value = e.target.value.replace(/\./g, '')
    setProjectName(e.target.value)
  }

  function onDbPassChange(e: any) {
    const value = e.target.value
    setDbPass(value)
    if (value == '') {
      setPasswordStrengthScore(-1)
      setPasswordStrengthMessage('')
    } else delayedCheckPasswordStrength(value)
  }

  function onCloudProviderChange(cloudProviderId: CloudProvider) {
    setCloudProvider(cloudProviderId)
    // on local/staging quick-select the default region, don't wait for the cloudflare location
    setDbRegion(
      ['staging', 'local'].includes(process.env.NEXT_PUBLIC_ENVIRONMENT ?? '')
        ? PROVIDERS[cloudProviderId].default_region
        : ''
    )
  }

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const onClickNext = async () => {
    if (!currentOrg) return console.error('Unable to retrieve current organization')

    const data: ProjectCreateVariables = {
      cloudProvider,
      organizationId: currentOrg.id,
      name: projectName.trim(),
      dbPass: dbPass,
      dbRegion: dbRegion,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the instance size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize: orgSubscription?.plan.id === 'free' ? undefined : instanceSize,
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

  // [Joshen] Refactor: DB Password could be a common component
  // used in multiple pages with repeated logic
  function generateStrongPassword() {
    const password = generator.generate({
      length: 16,
      numbers: true,
      uppercase: true,
    })

    setDbPass(password)
    delayedCheckPasswordStrength(password)
  }

  // [Fran] Enforce APSE1 region on staging
  function getAvailableRegions(cloudProvider: CloudProvider): Region {
    if (cloudProvider === 'AWS') {
      return process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
        ? pluckObjectFields(AWS_REGIONS, ['SOUTHEAST_ASIA'])
        : AWS_REGIONS
      // to do - may need to pluck regions for staging for FLY also
    } else if (cloudProvider === 'FLY') {
      return FLY_REGIONS
    }

    throw new Error('Invalid cloud provider')
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

  return (
    <Panel
      hideHeaderStyling
      loading={!isOrganizationsSuccess || isLoadingFreeProjectLimitCheck}
      title={
        <div key="panel-title">
          <h3>Create a new project</h3>
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
              onClick={onClickNext}
              loading={isCreatingNewProject || isSuccessNewProject}
              disabled={isCreatingNewProject || isSuccessNewProject || !canSubmit}
            >
              Create new project
            </Button>
          </div>
        </div>
      }
    >
      <>
        <Panel.Content className="pt-0 pb-6">
          <p className="text-sm text-foreground-lighter">
            Your project will have its own dedicated instance and full postgres database.
            <br />
            An API will be set up so you can easily interact with your new database.
            <br />
          </p>
        </Panel.Content>
        {projectCreationDisabled ? (
          <Panel.Content className="pb-8 border-t border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
            <DisabledWarningDueToIncident title="Project creation is currently disabled" />
          </Panel.Content>
        ) : (
          <>
            <Panel.Content
              className={[
                'space-y-4 border-t border-b',
                'border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark',
              ].join(' ')}
            >
              {(organizations?.length ?? 0) > 0 && (
                <Listbox
                  label="Organization"
                  layout="horizontal"
                  value={currentOrg?.slug}
                  onChange={(slug) => router.push(`/new/${slug}`)}
                >
                  {organizations?.map((x: any) => (
                    <Listbox.Option
                      key={x.id}
                      label={x.name}
                      value={x.slug}
                      addOnBefore={() => <IconUsers />}
                    >
                      {x.name}
                    </Listbox.Option>
                  ))}
                </Listbox>
              )}

              {!isAdmin && <NotOrganizationOwnerWarning />}
            </Panel.Content>

            {canCreateProject && (
              <>
                <Panel.Content
                  className={[
                    'border-b',
                    'border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark',
                  ].join(' ')}
                >
                  <Input
                    id="project-name"
                    layout="horizontal"
                    label="Name"
                    type="text"
                    placeholder="Project name"
                    value={projectName}
                    onChange={onProjectNameChange}
                    autoFocus
                  />
                </Panel.Content>

                {showNonProdFields && (
                  <Panel.Content
                    className={[
                      'border-b',
                      'border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark',
                    ].join(' ')}
                  >
                    <Input
                      id="custom-postgres-version"
                      layout="horizontal"
                      label="Postgres Version"
                      autoComplete="off"
                      descriptionText={
                        <p>
                          Specify a custom version of Postgres (Defaults to the latest)
                          <br />
                          This is only applicable for local/staging projects
                        </p>
                      }
                      type="text"
                      placeholder="Postgres Version"
                      value={postgresVersion}
                      onChange={(event: any) => setPostgresVersion(event.target.value)}
                    />
                  </Panel.Content>
                )}

                {cloudProviderEnabled && showNonProdFields && (
                  <Panel.Content
                    className={[
                      'border-b',
                      'border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark',
                    ].join(' ')}
                  >
                    <Listbox
                      layout="horizontal"
                      label="Cloud Provider"
                      type="select"
                      value={cloudProvider}
                      onChange={(value) => onCloudProviderChange(value)}
                      descriptionText="Cloud Provider (only for staging/local)"
                    >
                      {Object.values(PROVIDERS).map((providerObj) => {
                        const label = providerObj['name']
                        const value = providerObj['id']
                        return (
                          <Listbox.Option key={value} label={label} value={value}>
                            <span className="text-foreground">{label}</span>
                          </Listbox.Option>
                        )
                      })}
                    </Listbox>
                  </Panel.Content>
                )}

                {orgSubscription?.plan.id !== 'free' && (
                  <Panel.Content
                    className={[
                      'border-b',
                      'border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark',
                    ].join(' ')}
                  >
                    <Listbox
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
                                <IconExternalLink size={16} strokeWidth={1.5} />
                              </div>
                            </Link>

                            <Link
                              href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
                              target="_blank"
                            >
                              <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition">
                                <p className="text-sm m-0">Compute Billing</p>
                                <IconExternalLink size={16} strokeWidth={1.5} />
                              </div>
                            </Link>
                          </div>
                        </div>
                      }
                      type="select"
                      value={instanceSize}
                      onChange={(value) => setInstanceSize(value)}
                      descriptionText={
                        <>
                          <p>
                            Select the size for your dedicated database. You can always change this
                            later.
                          </p>
                          <p className="mt-1">
                            Your organization has $10/month in Compute Credits to cover one instance
                            on Micro Compute or parts of any other instance size.
                          </p>
                        </>
                      }
                    >
                      {sizes.map((option) => {
                        return (
                          <Listbox.Option
                            key={option}
                            label={`${instanceSizeSpecs[option].ram} RAM / ${instanceSizeSpecs[option].cpu} CPU (${instanceSizeSpecs[option].label})`}
                            value={option}
                          >
                            <div className="flex space-x-2">
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
                                <p className="text-xs text-muted">
                                  {instanceSizeSpecs[option].price}
                                </p>
                              </div>
                            </div>
                          </Listbox.Option>
                        )
                      })}
                    </Listbox>
                  </Panel.Content>
                )}

                <Panel.Content className="border-b border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
                  <Input
                    id="password"
                    copy={dbPass.length > 0}
                    layout="horizontal"
                    label="Database Password"
                    type="password"
                    placeholder="Type in a strong password"
                    value={dbPass}
                    onChange={onDbPassChange}
                    descriptionText={
                      <PasswordStrengthBar
                        passwordStrengthScore={passwordStrengthScore}
                        password={dbPass}
                        passwordStrengthMessage={passwordStrengthMessage}
                        generateStrongPassword={generateStrongPassword}
                      />
                    }
                    error={passwordStrengthWarning}
                  />
                </Panel.Content>

                <Panel.Content className="border-b border-panel-border-interior-light [[data-theme*=dark]_&]:border-panel-border-interior-dark">
                  <RegionSelector
                    cloudProvider={cloudProvider}
                    selectedRegion={dbRegion}
                    onSelectRegion={setDbRegion}
                  />
                </Panel.Content>
              </>
            )}

            {isAdmin && (
              <Panel.Content>
                {freePlanWithExceedingLimits && slug && (
                  <div className="mt-4">
                    <FreeProjectLimitWarning
                      membersExceededLimit={membersExceededLimit || []}
                      orgSlug={slug}
                    />
                  </div>
                )}
              </Panel.Content>
            )}
          </>
        )}
      </>
    </Panel>
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
