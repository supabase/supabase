import { PermissionAction } from '@supabase/shared-types/out/constants'
import generator from 'generate-password'
import { debounce, isUndefined } from 'lodash'
import { observer } from 'mobx-react-lite'
import Router, { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { useParams } from 'common/hooks'
import { SpendCapModal } from 'components/interfaces/BillingV2'
import {
  EmptyPaymentMethodWarning,
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
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useFlag, useStore, withAuth } from 'hooks'
import { get, post } from 'lib/common/fetch'
import {
  API_URL,
  AWS_REGIONS,
  CloudProvider,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  DEFAULT_PROVIDER,
  FLY_REGIONS,
  PRICING_TIER_DEFAULT_KEY,
  PRICING_TIER_FREE_KEY,
  PRICING_TIER_LABELS,
  PRICING_TIER_PRODUCT_IDS,
  PROVIDERS,
  Region,
} from 'lib/constants'
import { passwordStrength, pluckObjectFields } from 'lib/helpers'
import { NextPageWithLayout } from 'types'
import {
  Alert,
  Button,
  IconExternalLink,
  IconHelpCircle,
  IconInfo,
  IconUsers,
  Input,
  Listbox,
  Toggle,
} from 'ui'
import Link from 'next/link'
import { useProjectsQuery } from 'data/projects/projects-query'

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
  const [dbPricingTierKey, setDbPricingTierKey] = useState(PRICING_TIER_DEFAULT_KEY)
  const [newProjectedLoading, setNewProjectLoading] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const [paymentMethods, setPaymentMethods] = useState<any[] | undefined>(undefined)

  const [showSpendCapHelperModal, setShowSpendCapHelperModal] = useState(false)

  const [isSpendCapEnabled, setIsSpendCapEnabled] = useState(true)

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)
  const billedViaOrg = Boolean(currentOrg?.subscription_id)

  const { data: orgSubscription } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: billedViaOrg }
  )

  const { data: allProjects } = useProjectsQuery({
    enabled: currentOrg?.subscription_id != undefined,
  })

  const orgProjectCount = (allProjects || []).filter(
    (proj) => proj.organization_id === currentOrg?.id
  ).length

  const [availableRegions, setAvailableRegions] = useState(
    getAvailableRegions(PROVIDERS[cloudProvider].id)
  )

  const isAdmin = useCheckPermissions(PermissionAction.CREATE, 'projects')
  const isInvalidSlug = isUndefined(currentOrg)
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess
  const isEmptyPaymentMethod = paymentMethods ? !paymentMethods.length : false
  const isSelectFreeTier = dbPricingTierKey === PRICING_TIER_FREE_KEY
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

  const freePlanWithExceedingLimits =
    ((isSelectFreeTier && !billedViaOrg) || orgSubscription?.plan?.id === 'free') &&
    hasMembersExceedingFreeTierLimit

  const canCreateProject = isAdmin && !freePlanWithExceedingLimits

  const canSubmit =
    projectName !== '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion !== undefined &&
    dbPricingTierKey !== ''

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  /*
   * Handle no org
   * redirect to new org route
   */
  if (isEmptyOrganizations) {
    router.push(`/new`)
  }

  /*
   * Redirect to first org if the slug doesn't match an org slug
   * this is mainly to capture the /project/new url, which is redirected from database.new
   */
  if (isInvalidSlug && (organizations?.length ?? 0) > 0) {
    router.push(`/new/${organizations?.[0].slug}`)
  }

  useEffect(() => {
    // User added a new payment method
    if (router.query.setup_intent && router.query.redirect_status) {
      ui.setNotification({ category: 'success', message: 'Successfully added new payment method' })
    }
  }, [])

  async function getPaymentMethods(slug: string) {
    const { data: paymentMethods, error } = await get(`${API_URL}/organizations/${slug}/payments`)
    if (!error) {
      setPaymentMethods(paymentMethods)
    } else {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to retrieve payment methods: ${error.message}`,
      })
    }
  }

  useEffect(() => {
    if (slug) {
      getPaymentMethods(slug as string)
    }
  }, [slug])

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

  function onDbPricingPlanChange(value: string) {
    setDbPricingTierKey(value)
  }

  function onPaymentMethodAdded() {
    if (slug) {
      return getPaymentMethods(slug)
    }
  }

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const onClickNext = async () => {
    setNewProjectLoading(true)

    const dbTier = dbPricingTierKey === 'PRO' && !isSpendCapEnabled ? 'PAYG' : dbPricingTierKey

    const data: Record<string, any> = {
      cloud_provider: cloudProvider,
      org_id: currentOrg?.id,
      name: projectName.trim(),
      db_pass: dbPass,
      db_region: dbRegion,
      db_pricing_tier_id: (PRICING_TIER_PRODUCT_IDS as any)[dbTier],
    }
    if (postgresVersion) {
      if (!postgresVersion.match(/1[2-9]\..*/)) {
        setNewProjectLoading(false)
        ui.setNotification({
          category: 'error',
          message: `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`,
        })
        return
      }

      data['custom_supabase_internal_requests'] = {
        ami: { search_tags: { 'tag:postgresVersion': postgresVersion } },
      }
    }
    const response = await post(`${API_URL}/projects`, data)
    if (response.error) {
      setNewProjectLoading(false)
      ui.setNotification({
        error: response.error,
        category: 'error',
        message: `Failed to create new project: ${response.error.message}`,
      })
    } else {
      router.push(`/project/${response.ref}/building`)
    }
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
          <Button type="default" onClick={() => Router.push('/projects')}>
            Cancel
          </Button>
          <div className="items-center space-x-3">
            {!projectCreationDisabled && (
              <span className="text-xs text-scale-900">You can rename your project later</span>
            )}
            <Button
              onClick={onClickNext}
              loading={newProjectedLoading}
              disabled={newProjectedLoading || !canSubmit}
            >
              Create new project
            </Button>
          </div>
        </div>
      }
    >
      <>
        <Panel.Content className="pt-0 pb-6">
          <p className="text-sm text-scale-900">
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
                            <span className="text-scale-1200">{label}</span>
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
                          <span className="text-scale-1200">{label}</span>
                        </Listbox.Option>
                      )
                    })}
                  </Listbox>
                </Panel.Content>
              </>
            )}

            {billedViaOrg && (
              <Panel.Content>
                <InformationBox
                  icon={<IconInfo size="large" strokeWidth={1.5} />}
                  defaultVisibility={true}
                  hideCollapse
                  title="Billed via organization"
                  description={
                    <div className="space-y-3">
                      <p className="text-sm leading-normal">
                        This organization uses the new organization-level billing and is on the{' '}
                        <span className="text-brand">{orgSubscription?.plan?.name} plan</span>.
                      </p>

                      {/* Show info when launching a new project in a paid org that already has at least one project */}
                      {orgSubscription?.plan?.id !== 'free' && orgProjectCount > 0 && (
                        <p>
                          Launching another project incurs additional compute costs (starting at $10
                          per month).
                        </p>
                      )}

                      <div>
                        <Link href="https://www.notion.so/supabase/Organization-Level-Billing-9c159d69375b4af095f0b67881276582?pvs=4">
                          <a target="_blank" rel="noreferrer">
                            <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                              Documentation
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </div>
                  }
                />
              </Panel.Content>
            )}

            {isAdmin && (
              <Panel.Content>
                {!billedViaOrg && (
                  <Listbox
                    label="Pricing Plan"
                    layout="horizontal"
                    value={dbPricingTierKey}
                    onChange={onDbPricingPlanChange}
                    descriptionText={
                      <>
                        Select a plan that suits your needs.&nbsp;
                        <a
                          className="underline"
                          target="_blank"
                          rel="noreferrer"
                          href="https://supabase.com/pricing"
                        >
                          More details
                        </a>
                        {!isSelectFreeTier && !isEmptyPaymentMethod && (
                          <Alert
                            title="Your payment method will be charged"
                            variant="warning"
                            withIcon
                            className="mt-3"
                          >
                            <p>
                              By creating a new Pro Project, there will be an immediate charge of
                              $25 once the project has been created.
                            </p>
                          </Alert>
                        )}
                      </>
                    }
                  >
                    {Object.entries(PRICING_TIER_LABELS).map(([k, v]) => {
                      const label = `${v}${k === 'PRO' ? ' - $25/month' : ' - $0/month'}`
                      return (
                        <Listbox.Option key={k} label={label} value={k}>
                          {label}
                        </Listbox.Option>
                      )
                    })}
                  </Listbox>
                )}

                {freePlanWithExceedingLimits && slug && (
                  <div className={billedViaOrg ? '' : 'mt-4'}>
                    <FreeProjectLimitWarning
                      membersExceededLimit={membersExceededLimit || []}
                      orgLevelBilling={billedViaOrg}
                      orgSlug={slug}
                    />
                  </div>
                )}

                {!billedViaOrg && !isSelectFreeTier && isEmptyPaymentMethod && (
                  <EmptyPaymentMethodWarning onPaymentMethodAdded={onPaymentMethodAdded} />
                )}
              </Panel.Content>
            )}

            {!billedViaOrg && !isSelectFreeTier && (
              <>
                <Panel.Content className="border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
                  <Toggle
                    id="project-name"
                    layout="horizontal"
                    label={
                      <div className="flex space-x-4">
                        <span>Spend Cap</span>
                        <IconHelpCircle
                          size={16}
                          strokeWidth={1.5}
                          className="transition opacity-50 cursor-pointer hover:opacity-100"
                          onClick={() => setShowSpendCapHelperModal(true)}
                        />
                      </div>
                    }
                    placeholder="Project name"
                    checked={isSpendCapEnabled}
                    onChange={() => setIsSpendCapEnabled(!isSpendCapEnabled)}
                    descriptionText={
                      <div>
                        <p>
                          By default, Pro projects have spend caps to control costs. When enabled,
                          usage is limited to the plan's quota, with restrictions when limits are
                          exceeded. To scale beyond Pro limits without restrictions, disable the
                          spend cap and pay for over-usage beyond the quota.
                        </p>
                      </div>
                    }
                  />
                </Panel.Content>

                <SpendCapModal
                  visible={showSpendCapHelperModal}
                  onHide={() => setShowSpendCapHelperModal(false)}
                />
              </>
            )}
          </>
        )}
      </>
    </Panel>
  )
}

const PageLayout = withAuth(({ children }) => {
  const { slug } = useParams()

  const { data: organizations } = useOrganizationsQuery()
  const currentOrg = organizations?.find((o: any) => o.slug === slug)

  return (
    <WizardLayoutWithoutAuth organization={currentOrg} project={null}>
      {children}
    </WizardLayoutWithoutAuth>
  )
})

Wizard.getLayout = (page) => <PageLayout>{page}</PageLayout>

export default observer(Wizard)
