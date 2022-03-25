/**
 * Org is selected, creating a new project
 */

import Router, { useRouter } from 'next/router'
import { useRef, useState, useEffect } from 'react'
import { debounce, isUndefined, values } from 'lodash'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { Button, Listbox, IconUsers, IconAlertCircle, Input, IconLoader } from '@supabase/ui'

import { getURL, passwordStrength } from 'lib/helpers'
import { post } from 'lib/common/fetch'
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
import { useStore, withAuth, useSubscriptionStats } from 'hooks'

import { WizardLayout } from 'components/layouts'
import Panel from 'components/to-be-cleaned/Panel'
import InformationBox from 'components/ui/InformationBox'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { AddNewPaymentMethodModal } from 'components/interfaces/Billing'

interface StripeCustomer {
  paymentMethods: any
  customer: any
  error?: any
}

async function fetchStripeAccount(stripeCustomerId: string) {
  try {
    const customer = await post(`${API_URL}/stripe/customer`, {
      stripe_customer_id: stripeCustomerId,
    })
    if (customer.error) throw customer.error
    return customer
  } catch (error: any) {
    return { error }
  }
}

export const PageLayout = () => {
  return <Wizard />
}

export default withAuth(observer(PageLayout))

export const Wizard = observer(() => {
  const router = useRouter()
  const { slug } = router.query
  const { app, ui } = useStore()

  const subscriptionStats = useSubscriptionStats()

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [dbRegion, setDbRegion] = useState(REGIONS_DEFAULT)
  const [dbPricingTierKey, setDbPricingTierKey] = useState(PRICING_TIER_DEFAULT_KEY)
  const [newProjectedLoading, setNewProjectLoading] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const [stripeCustomer, setStripeCustomer] = useState<StripeCustomer | undefined>(undefined)

  const organizations = values(toJS(app.organizations.list()))
  const currentOrg = organizations.find((o: any) => o.slug === slug)
  const stripeCustomerId = currentOrg?.stripe_customer_id

  const totalFreeProjects = subscriptionStats.total_free_projects
  const freeProjectsLimit = ui.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT

  const isOrganizationOwner = currentOrg?.is_owner || !app.organizations.isInitialized
  const isEmptyOrganizations = organizations.length <= 0 && app.organizations.isInitialized
  const isEmptyPaymentMethod = stripeCustomer
    ? stripeCustomer.paymentMethods?.data?.length <= 0
    : undefined
  const isOverFreeProjectLimit = totalFreeProjects >= freeProjectsLimit
  const isInvalidSlug = isUndefined(currentOrg)
  const isSelectFreeTier = dbPricingTierKey === PRICING_TIER_FREE_KEY

  const canCreateProject =
    currentOrg?.is_owner &&
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
    async function loadStripeAccountAsync(id: string) {
      const res = await fetchStripeAccount(id)
      if (!res.error) {
        setStripeCustomer(res)
      }
    }

    if (stripeCustomerId) {
      loadStripeAccountAsync(stripeCustomerId)
    }
  }, [stripeCustomerId])

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
      // Use redirect to reload store data properly
      // after creating a new project
      window.location.replace(`/project/${response.ref}/building`)
    }
  }

  return (
    <WizardLayout organization={currentOrg} project={null}>
      <Panel
        hideHeaderStyling
        isLoading={app.organizations.isInitialized}
        title={
          <div key="panel-title">
            <h3>Create a new project</h3>
          </div>
        }
        footer={
          <div key="panel-footer" className="flex items-center w-full justify-between">
            <Button type="default" onClick={() => Router.push('/')}>
              Cancel
            </Button>
            <div className="space-x-3 items-center">
              <span className="text-scale-900 text-xs">You can rename your project later</span>
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

          <Panel.Content className="Form section-block--body has-inputs-centered border-b border-t border-panel-border-interior-light dark:border-panel-border-interior-dark space-y-4">
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

            {!isOrganizationOwner && <NotOrganizationOwnerWarning />}
          </Panel.Content>

          {canCreateProject && (
            <>
              <Panel.Content className="Form section-block--body has-inputs-centered border-b border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
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

              <Panel.Content className="Form section-block--body has-inputs-centered border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
                <Input
                  id="password"
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
                    />
                  }
                  error={passwordStrengthWarning}
                />
              </Panel.Content>

              <Panel.Content className="Form section-block--body has-inputs-centered border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
                <Listbox
                  layout="horizontal"
                  label="Region"
                  type="select"
                  value={dbRegion}
                  // @ts-ignore
                  onChange={(value: string) => onDbRegionChange(value)}
                  descriptionText="Select a region close to you for the best performance."
                >
                  {Object.keys(REGIONS).map((option: string, i) => {
                    const label = Object.values(REGIONS)[i]
                    return (
                      <Listbox.Option
                        key={option}
                        label={label}
                        value={label}
                        addOnBefore={({ active, selected }: any) => (
                          <img
                            className="w-5 rounded-sm"
                            src={`/img/regions/${Object.keys(REGIONS)[i]}.svg`}
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

          {currentOrg?.is_owner && (
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
                  </>
                }
              >
                {Object.entries(PRICING_TIER_LABELS).map(([k, v]) => (
                  <Listbox.Option key={k} label={v} value={k}>
                    {`${v}${k === 'PRO' ? ' - $25/month' : ''}`}
                  </Listbox.Option>
                ))}
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
              <div className="py-10 flex items-center justify-center">
                <IconLoader size={16} className="animate-spin" />
              </div>
            </Panel.Content>
          )}
        </>
      </Panel>
    </WizardLayout>
  )
})

const NotOrganizationOwnerWarning = () => {
  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="You do not have permission to create a project"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              Only the organization owner can create new projects. Contact your organization owner
              to create a new project for this organization.
            </p>
          </div>
        }
      />
    </div>
  )
}

const FreeProjectLimitWarning = ({ limit }: { limit: number }) => {
  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="Your account has reached its free project limit"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              {`Your account can only have up to ${limit} free projects - to create another free project, you'll need to delete an existing free project first. Otherwise, you may create a project on the Pro tier instead.`}
            </p>
          </div>
        }
      />
    </div>
  )
}

const EmptyPaymentMethodWarning = observer(
  ({ stripeCustomerId }: { stripeCustomerId: string | undefined }) => {
    const { ui } = useStore()
    const slug = ui.selectedOrganization?.slug

    const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState<boolean>(false)

    return (
      <div className="mt-4">
        <InformationBox
          icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
          defaultVisibility={true}
          hideCollapse
          title="Your organization has no payment methods"
          description={
            <div className="space-y-3">
              <p className="text-sm leading-normal">
                You need to add a payment method for your organization before creating a paid
                project.
              </p>
              <Button type="secondary" onClick={() => setShowAddPaymentMethodModal(true)}>
                Add a payment method
              </Button>
            </div>
          }
        />
        <AddNewPaymentMethodModal
          visible={showAddPaymentMethodModal}
          returnUrl={`${getURL()}/new/${slug}`}
          onCancel={() => setShowAddPaymentMethodModal(false)}
        />
      </div>
    )
  }
)
