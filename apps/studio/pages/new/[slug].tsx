import { PermissionAction } from '@supabase/shared-types/out/constants'
import generator from 'generate-password-browser'
import { debounce } from 'lodash'
import { ExternalLink, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import {
  AVAILABLE_SIZES,
  INSTANCE_SIZE_SPECS,
} from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { RegionSelector } from 'components/interfaces/ProjectCreation/RegionSelector'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
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
  CloudProvider,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  PROVIDERS,
} from 'lib/constants'
import { passwordStrength } from 'lib/helpers'
import type { NextPageWithLayout } from 'types'
import { Badge, Button, Input, Listbox } from 'ui'

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

  return (
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
        {projectCreationDisabled ? (
          <Panel.Content className="pb-8">
            <DisabledWarningDueToIncident title="Project creation is currently disabled" />
          </Panel.Content>
        ) : (
          <div className="divide-y divide-border-muted">
            <Panel.Content className={['space-y-4'].join(' ')}>
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
                      addOnBefore={() => <Users size={18} />}
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
                <Panel.Content>
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
                  <Panel.Content>
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
                  <Panel.Content>
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
                  <Panel.Content>
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
                      {AVAILABLE_SIZES.map((option) => {
                        return (
                          <Listbox.Option
                            key={option}
                            label={`${INSTANCE_SIZE_SPECS[option].ram} RAM / ${INSTANCE_SIZE_SPECS[option].cpu} CPU (${INSTANCE_SIZE_SPECS[option].label})`}
                            value={option}
                          >
                            <div className="flex space-x-2">
                              <div className="text-center w-[80px]">
                                <Badge
                                  variant={option === 'micro' ? 'default' : 'brand'}
                                  className="rounded-md w-16 text-center flex justify-center font-mono uppercase"
                                >
                                  {INSTANCE_SIZE_SPECS[option].label}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                <span className="text-foreground">
                                  {INSTANCE_SIZE_SPECS[option].ram} RAM /{' '}
                                  {INSTANCE_SIZE_SPECS[option].cpu} CPU
                                </span>
                                <p className="text-xs text-muted">
                                  {INSTANCE_SIZE_SPECS[option].price}
                                </p>
                              </div>
                            </div>
                          </Listbox.Option>
                        )
                      })}
                    </Listbox>
                  </Panel.Content>
                )}

                <Panel.Content>
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

                <Panel.Content>
                  <RegionSelector
                    cloudProvider={cloudProvider}
                    selectedRegion={dbRegion}
                    onSelectRegion={setDbRegion}
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
