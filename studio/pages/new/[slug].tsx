import Router, { useRouter } from 'next/router'
import { useRef, useState, useEffect } from 'react'
import { debounce, isUndefined, values } from 'lodash'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import generator from 'generate-password'
import { Button, Listbox, IconUsers, Input, IconLoader, Alert } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { passwordStrength, pluckObjectFields } from 'lib/helpers'
import { get, post } from 'lib/common/fetch'
import {
  API_URL,
  PROVIDERS,
  REGIONS,
  REGIONS_DEFAULT,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  PRICING_TIER_LABELS,
  PRICING_TIER_DEFAULT_KEY,
  PRICING_TIER_FREE_KEY,
  DEFAULT_FREE_PROJECTS_LIMIT,
  PRICING_TIER_PRODUCT_IDS,
} from 'lib/constants'
import { useStore, useFlag, withAuth, useSubscriptionStats, checkPermissions } from 'hooks'

import { WizardLayoutWithoutAuth } from 'components/layouts'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import DisabledWarningDueToIncident from 'components/ui/DisabledWarningDueToIncident'
import {
  FreeProjectLimitWarning,
  NotOrganizationOwnerWarning,
  EmptyPaymentMethodWarning,
} from 'components/interfaces/Organization/NewProject'

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug } = router.query
  const { app, ui } = useStore()

  const enablePermissions = useFlag('enablePermissions')
  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')
  const subscriptionStats = useSubscriptionStats()

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [dbRegion, setDbRegion] = useState(REGIONS_DEFAULT)
  const [dbPricingTierKey, setDbPricingTierKey] = useState(PRICING_TIER_DEFAULT_KEY)
  const [newProjectedLoading, setNewProjectLoading] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const [paymentMethods, setPaymentMethods] = useState<any[] | undefined>(undefined)

  const organizations = values(toJS(app.organizations.list()))
  const currentOrg = organizations.find((o: any) => o.slug === slug)
  const stripeCustomerId = currentOrg?.stripe_customer_id

  const isOrganizationOwner = ui.selectedOrganization?.is_owner
  const totalFreeProjects = subscriptionStats.total_active_free_projects
  const freeProjectsLimit = ui.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT
  const availableRegions = getAvailableRegions()

  const isAdmin = enablePermissions
    ? checkPermissions(PermissionAction.CREATE, 'projects')
    : isOrganizationOwner

  const isEmptyOrganizations = organizations.length <= 0 && app.organizations.isInitialized
  const isEmptyPaymentMethod = paymentMethods ? !paymentMethods.length : false
  const isOverFreeProjectLimit = totalFreeProjects >= freeProjectsLimit
  const isInvalidSlug = isUndefined(currentOrg)
  const isSelectFreeTier = dbPricingTierKey === PRICING_TIER_FREE_KEY

  const canCreateProject =
    isAdmin &&
    !subscriptionStats.isError &&
    !subscriptionStats.isLoading &&
    (!isSelectFreeTier || (isSelectFreeTier && !isOverFreeProjectLimit))

  const canSubmit =
    projectName != '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion != '' &&
    dbPricingTierKey != '' &&
    (isSelectFreeTier || (!isSelectFreeTier && !isEmptyPaymentMethod))

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
  if (isInvalidSlug && organizations.length > 0) {
    router.push(`/new/${organizations[0].slug}`)
  }

  useEffect(() => {
    // User added a new payment method
    if (router.query.setup_intent && router.query.redirect_status) {
      ui.setNotification({ category: 'success', message: 'Successfully added new payment method' })
    }
  }, [])

  useEffect(() => {
    async function getPaymentMethods(slug: string) {
      const { data: paymentMethods, error } = await get(`${API_URL}/organizations/${slug}/payments`)
      if (!error) {
        setPaymentMethods(paymentMethods)
      }
    }

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

  function onDbRegionChange(value: string) {
    setDbRegion(value)
  }

  function onDbPricingPlanChange(value: string) {
    setDbPricingTierKey(value)
  }

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const onClickNext = async () => {
    setNewProjectLoading(true)
    const data = {
      cloud_provider: PROVIDERS.AWS.id, // hardcoded for DB instances to be under AWS
      org_id: currentOrg?.id,
      name: projectName,
      db_pass: dbPass,
      db_region: dbRegion,
      db_pricing_tier_id: (PRICING_TIER_PRODUCT_IDS as any)[dbPricingTierKey],
    }
    const response = await post(`${API_URL}/projects`, data)
    if (response.error) {
      setNewProjectLoading(false)
      ui.setNotification({
        category: 'error',
        message: `Failed to create new project: ${response.error.message}`,
      })
    } else {
      app.onProjectCreated(response)
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
  function getAvailableRegions() {
    return process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? pluckObjectFields(REGIONS, ['SOUTHEAST_ASIA'])
      : REGIONS
  }

  return (
    <Panel
      hideHeaderStyling
      loading={!app.organizations.isInitialized}
      title={
        <div key="panel-title">
          <h3>Create a new project</h3>
        </div>
      }
      footer={
        <div key="panel-footer" className="flex w-full items-center justify-between">
          <Button type="default" onClick={() => Router.push('/')}>
            Cancel
          </Button>
          <div className="items-center space-x-3">
            {!projectCreationDisabled && (
              <span className="text-scale-900 text-xs">You can rename your project later</span>
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
          <p className="text-scale-900 text-sm">
            Your project will have its own dedicated instance and full postgres database.
            <br />
            An API will be set up so you can easily interact with your new database.
            <br />
          </p>
        </Panel.Content>
        {projectCreationDisabled ? (
          <Panel.Content className="border-panel-border-interior-light dark:border-panel-border-interior-dark border-t pb-8">
            <DisabledWarningDueToIncident title="Project creation is currently disabled" />
          </Panel.Content>
        ) : (
          <>
            <Panel.Content className="Form section-block--body has-inputs-centered border-panel-border-interior-light dark:border-panel-border-interior-dark space-y-4 border-t border-b">
              {organizations.length > 0 && (
                <Listbox
                  label="Organization"
                  layout="horizontal"
                  value={currentOrg?.slug}
                  onChange={(slug) => router.push(`/new/${slug}`)}
                >
                  {organizations.map((x: any) => (
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
                <Panel.Content className="Form section-block--body has-inputs-centered border-panel-border-interior-light dark:border-panel-border-interior-dark border-t border-b">
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

                <Panel.Content className="Form section-block--body has-inputs-centered border-panel-border-interior-light dark:border-panel-border-interior-dark border-b">
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

                <Panel.Content className="Form section-block--body has-inputs-centered border-panel-border-interior-light dark:border-panel-border-interior-dark border-b">
                  <Listbox
                    layout="horizontal"
                    label="Region"
                    type="select"
                    value={dbRegion}
                    // @ts-ignore
                    onChange={(value: string) => onDbRegionChange(value)}
                    descriptionText="Select a region close to you for the best performance."
                  >
                    {Object.keys(availableRegions).map((option: string, i) => {
                      const label = Object.values(availableRegions)[i] as string
                      return (
                        <Listbox.Option
                          key={option}
                          label={label}
                          value={label}
                          addOnBefore={({ active, selected }: any) => (
                            <img
                              className="w-5 rounded-sm"
                              src={`/img/regions/${Object.keys(availableRegions)[i]}.svg`}
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
            {isAdmin && (
              <Panel.Content className="Form section-block--body has-inputs-centered ">
                <Listbox
                  label="Pricing Plan"
                  layout="horizontal"
                  value={dbPricingTierKey}
                  // @ts-ignore
                  onChange={onDbPricingPlanChange}
                  // @ts-ignore
                  descriptionText={
                    <>
                      Select a plan that suits your needs.&nbsp;
                      <a className="underline" target="_blank" href="https://supabase.com/pricing">
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
                            By creating a new Pro Project, there will be an immediate charge of $25
                            once the project has been created.
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

                {isSelectFreeTier && isOverFreeProjectLimit && (
                  <FreeProjectLimitWarning limit={freeProjectsLimit} />
                )}

                {!isSelectFreeTier && isEmptyPaymentMethod && (
                  <EmptyPaymentMethodWarning stripeCustomerId={stripeCustomerId} />
                )}
              </Panel.Content>
            )}
            {subscriptionStats.isLoading && (
              <Panel.Content>
                <div className="flex items-center justify-center py-10">
                  <IconLoader size={16} className="animate-spin" />
                </div>
              </Panel.Content>
            )}
          </>
        )}
      </>
    </Panel>
  )
}

const PageLayout = withAuth(
  observer(({ children }) => {
    const router = useRouter()
    const { slug } = router.query

    const { app } = useStore()
    const organizations = values(toJS(app.organizations.list()))
    const currentOrg = organizations.find((o: any) => o.slug === slug)

    return (
      <WizardLayoutWithoutAuth organization={currentOrg} project={null}>
        {children}
      </WizardLayoutWithoutAuth>
    )
  })
)

Wizard.getLayout = (page) => <PageLayout>{page}</PageLayout>

export default observer(Wizard)
