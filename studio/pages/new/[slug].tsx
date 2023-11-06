import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import generator from 'generate-password'
import { debounce } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
} from 'components/interfaces/Organization/NewProject'
import { WizardLayoutWithoutAuth } from 'components/layouts'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import InformationBox from 'components/ui/InformationBox'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useFlag, useStore, withAuth } from 'hooks'
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
import { NextPageWithLayout } from 'types'
import { Button, IconExternalLink, IconInfo, IconUsers, Input, Listbox } from 'ui'

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { ui } = useStore()

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const cloudProviderEnabled = useFlag('enableFlyCloudProvider')
  const { data: membersExceededLimit, isLoading: isLoadingFreeProjectLimitCheck } =
    useFreeProjectLimitCheckQuery({ slug })

  const [projectName, setProjectName] = useState('')
  const [postgresVersion, setPostgresVersion] = useState('')
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>(PROVIDERS[DEFAULT_PROVIDER].id)

  const [dbPass, setDbPass] = useState('')
  const [dbRegion, setDbRegion] = useState(PROVIDERS[cloudProvider].default_region)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)

  const { data: orgSubscription } = useOrgSubscriptionQuery({ orgSlug: slug })

  const { data: allProjects } = useProjectsQuery({})

  const {
    mutate: createProject,
    isLoading: isCreatingNewProject,
    isSuccess: isSuccessNewProject,
  } = useProjectCreateMutation({
    onSuccess: (res) => {
      router.push(`/project/${res.ref}/building`)
    },
  })

  const orgProjectCount = (allProjects || []).filter(
    (proj) => proj.organization_id === currentOrg?.id
  ).length

  const [availableRegions, setAvailableRegions] = useState(
    getAvailableRegions(PROVIDERS[cloudProvider].id)
  )

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
      ui.setNotification({ category: 'success', message: 'Successfully added new payment method' })
    }
  }, [router.query.redirect_status, router.query.setup_intent, ui])

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
    if (cloudProviderId === PROVIDERS.AWS.id) {
      setAvailableRegions(getAvailableRegions(PROVIDERS['AWS'].id))
      setDbRegion(PROVIDERS['AWS'].default_region)
    } else {
      setAvailableRegions(getAvailableRegions(PROVIDERS['FLY'].id))
      setDbRegion(PROVIDERS['FLY'].default_region)
    }
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
      dbPricingTierId: 'tier_free', // gets ignored due to org billing subscription anyway
    }
    if (postgresVersion) {
      if (!postgresVersion.match(/1[2-9]\..*/)) {
        return ui.setNotification({
          category: 'error',
          message: `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`,
        })
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
          <Panel.Content className="pb-8 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
            <DisabledWarningDueToIncident title="Project creation is currently disabled" />
          </Panel.Content>
        ) : (
          <>
            <Panel.Content
              className={[
                'space-y-4 border-t border-b',
                'border-panel-border-interior-light dark:border-panel-border-interior-dark',
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
                    'border-panel-border-interior-light dark:border-panel-border-interior-dark',
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
                      'border-panel-border-interior-light dark:border-panel-border-interior-dark',
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
                      'border-panel-border-interior-light dark:border-panel-border-interior-dark',
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

                <Panel.Content className="border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
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

                <Panel.Content className="border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
                  <Listbox
                    layout="horizontal"
                    label="Region"
                    type="select"
                    value={dbRegion}
                    onChange={(value) => setDbRegion(value)}
                    descriptionText="Select a region close to your users for the best performance."
                  >
                    {Object.keys(availableRegions).map((option: string, i) => {
                      const label = Object.values(availableRegions)[i] as string
                      return (
                        <Listbox.Option
                          key={option}
                          label={label}
                          value={label}
                          addOnBefore={() => (
                            <img
                              alt="region icon"
                              className="w-5 rounded-sm"
                              src={`${router.basePath}/img/regions/${
                                Object.keys(availableRegions)[i]
                              }.svg`}
                            />
                          )}
                        >
                          <span className="text-foreground">{label}</span>
                        </Listbox.Option>
                      )
                    })}
                  </Listbox>
                </Panel.Content>
              </>
            )}

            <Panel.Content>
              <InformationBox
                icon={<IconInfo size="large" strokeWidth={1.5} />}
                defaultVisibility={true}
                hideCollapse
                title="Billed via organization"
                description={
                  <div className="space-y-3">
                    <p className="text-sm leading-normal">
                      This organization uses the new organization-based billing and is on the{' '}
                      <span className="text-brand">{orgSubscription?.plan?.name} plan</span>.
                    </p>

                    {/* Show info when launching a new project in a paid org that has no project yet */}
                    {orgSubscription?.plan?.id !== 'free' && orgProjectCount === 0 && (
                      <div>
                        <p>
                          As this is the first project you're launching in this organization, it
                          comes with no additional compute costs.
                        </p>
                      </div>
                    )}

                    {/* Show info when launching a new project in a paid org that already has at least one project */}
                    {orgSubscription?.plan?.id !== 'free' && orgProjectCount > 0 && (
                      <div>
                        <p>
                          Launching another project incurs additional compute costs, starting at
                          $0.01344 per hour (~$10/month). You can also create a new organization
                          under the free plan in case you have not exceeded your 2 free project
                          limit.
                        </p>
                      </div>
                    )}

                    <div className="space-x-3">
                      <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                        <Link
                          href="https://supabase.com/blog/organization-based-billing"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Announcement
                        </Link>
                      </Button>
                      <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                        <Link
                          href="https://supabase.com/docs/guides/platform/org-based-billing"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Documentation
                        </Link>
                      </Button>
                    </div>
                  </div>
                }
              />
            </Panel.Content>

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
