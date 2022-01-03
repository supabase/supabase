/**
 * Org is selected, creating a new project
 */

import Router, { NextRouter, useRouter } from 'next/router'
import { useRef, useState, createContext, useContext, useEffect } from 'react'
import { debounce, isUndefined, values } from 'lodash'
import { makeAutoObservable, toJS } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { Dictionary } from '@supabase/grid'
import {
  Button,
  Typography,
  Listbox,
  IconUsers,
  IconAlertCircle,
  IconDollarSign,
} from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import {
  PROVIDERS,
  REGIONS,
  REGIONS_DEFAULT,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  PASSWORD_STRENGTH,
  PASSWORD_STRENGTH_COLOR,
  PASSWORD_STRENGTH_PERCENTAGE,
  PRICING_PLANS,
  PRICING_PLANS_DEFAULT,
} from 'lib/constants'

import { useStore, withAuth } from 'hooks'
import { IRootStore } from 'stores'
import { WizardLayout } from 'components/layouts'
import FormField from 'components/to-be-cleaned/forms/FormField'
import Panel from 'components/to-be-cleaned/Panel'
import InformationBox from 'components/ui/InformationBox'
import { Organization } from 'types'
import { getURL } from 'lib/helpers'

interface StripeCustomer {
  paymentMethods: any
  customer: any
  error?: any
}

interface IHomePageStore {
  store: IRootStore
  organizations: Dictionary<any>[]
  currentOrg: Organization | undefined
  isEmptyOrganizations: boolean
  isEmptyPaymentMethod: boolean | undefined
  isInvalidSlug: boolean
  isOverFreeProjectLimit: boolean
  stripeCustomerId: string | undefined
  loadStripeAccount: () => void
}
class HomePageStore implements IHomePageStore {
  store: IRootStore
  router: NextRouter

  stripeCustomerError: Error | undefined
  stripeCustomer: StripeCustomer | undefined

  constructor(store: IRootStore, router: NextRouter) {
    makeAutoObservable(this)
    this.store = store
    this.router = router
  }

  get organizations() {
    return values(toJS(this.store.app.organizations.list()))
  }

  get currentOrg() {
    const { slug } = this.router.query
    return this.organizations.find((o: any) => o.slug === slug)
  }

  get stripeCustomerId() {
    return this.currentOrg?.stripe_customer_id
  }

  get isEmptyOrganizations() {
    return this.organizations.length <= 0
  }

  get isEmptyPaymentMethod() {
    if (!this.stripeCustomer?.paymentMethods) return undefined
    return this.stripeCustomer?.paymentMethods?.data?.length <= 0
  }

  get isInvalidSlug() {
    return isUndefined(this.currentOrg)
  }

  get isOverFreeProjectLimit() {
    const freeProjects = this.currentOrg?.total_free_projects ?? 0
    const limit = this.currentOrg?.project_limit ?? 0
    return freeProjects >= limit
  }

  async loadStripeAccount() {
    try {
      const customer = await post(`${API_URL}/stripe/customer`, {
        stripe_customer_id: this.stripeCustomerId,
      })
      if (customer.error) throw customer.error
      this.stripeCustomer = customer
    } catch (error: any) {
      this.stripeCustomerError = error
    }
  }
}
const PageContext = createContext<IHomePageStore>(undefined!)

export const PageLayout = () => {
  const store = useStore()
  const router = useRouter()
  const _pageState = useLocalObservable(() => new HomePageStore(store, router))

  return (
    <PageContext.Provider value={_pageState}>
      <Wizard />
    </PageContext.Provider>
  )
}

export default withAuth(observer(PageLayout))

export const Wizard = observer(() => {
  const _pageState = useContext(PageContext)

  const router = useRouter()
  const { ui } = useStore()

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [dbRegion, setDbRegion] = useState(REGIONS_DEFAULT)
  const [dbPricingPlan, setDbPricingPlan] = useState(PRICING_PLANS_DEFAULT)
  const [newProjectedLoading, setNewProjectLoading] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)

  const canSubmit =
    projectName != '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion != '' &&
    dbPricingPlan != ''
  const passwordErrorMessage =
    dbPass != '' && passwordStrengthScore < DEFAULT_MINIMUM_PASSWORD_STRENGTH
      ? 'You need a stronger password'
      : undefined

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  useEffect(() => {
    /*
     * Handle no org
     * redirect to new org route
     */
    if (_pageState.isEmptyOrganizations) {
      router.push(`/new`)
    }
  }, [_pageState.isEmptyOrganizations])

  useEffect(() => {
    /*
     * Redirect to first org if the slug doesn't match an org slug
     * this is mainly to capture the /project/new url, which is redirected from database.new
     */
    if (_pageState.isInvalidSlug && _pageState.organizations.length > 0) {
      router.push(`/new/${_pageState.organizations[0].slug}`)
    }
  }, [_pageState.isInvalidSlug, _pageState.organizations])

  useEffect(() => {
    if (_pageState.stripeCustomerId) {
      _pageState.loadStripeAccount()
    }
  }, [_pageState.stripeCustomerId])

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

  function onDbRegionChange(e: any) {
    setDbRegion(e.target.value)
  }

  function onDbPricingPlanChange(value: string) {
    setDbPricingPlan(value)
  }

  async function checkPasswordStrength(value: any) {
    let passwordStrength = ''
    if (value && value !== '') {
      const response = await post(`${API_URL}/profile/password-check`, { password: value })
      if (!response.error) {
        const { result } = response
        const score = (PASSWORD_STRENGTH as any)[result.score]
        const suggestions = result.feedback?.suggestions
          ? result.feedback.suggestions.join(' ')
          : ''
        passwordStrength = `${score} ${suggestions}`
        setPasswordStrengthScore(result.score)
        setPasswordStrengthWarning(result.feedback.warning ? result.feedback.warning : '')
      }
    }

    setPasswordStrengthMessage(passwordStrength)
  }

  const onClickNext = async () => {
    setNewProjectLoading(true)
    const data = {
      cloud_provider: PROVIDERS.AWS.id, // hardcoded for DB instances to be under AWS
      org_id: _pageState.currentOrg?.id,
      name: projectName,
      db_pass: dbPass,
      db_region: dbRegion,
      db_pricing_plan: dbPricingPlan,
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
    <WizardLayout organization={_pageState.currentOrg} project={null}>
      <Panel
        hideHeaderStyling
        title={
          <div key="panel-title">
            <Typography.Title level={4} className="mb-0">
              Create a new project
            </Typography.Title>
          </div>
        }
        footer={
          <div key="panel-footer" className="flex items-center w-full justify-between">
            <Button type="default" onClick={() => Router.push('/')}>
              Cancel
            </Button>
            <div className="space-x-3">
              <Typography.Text type="secondary" small>
                You can rename your project later
              </Typography.Text>
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
            <Typography.Text>
              Your project will have its own dedicated instance and full postgres database.
              <br />
              An API will be set up so you can easily interact with your new database.
              <br />
            </Typography.Text>
          </Panel.Content>
          <Panel.Content className="Form section-block--body has-inputs-centered border-b border-t border-panel-border-interior-light dark:border-panel-border-interior-dark space-y-4">
            <Listbox
              label="Organization"
              layout="horizontal"
              value={_pageState.currentOrg?.slug}
              onChange={(slug) => (window.location.href = `/new/${slug}`)}
            >
              {_pageState.organizations.map((x: any) => (
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
          </Panel.Content>

          <>
            <Panel.Content className="Form section-block--body has-inputs-centered border-b border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
              <FormField
                // @ts-ignore
                label="Name"
                type="text"
                placeholder="Project name"
                value={projectName}
                onChange={onProjectNameChange}
                autoFocus
              />
            </Panel.Content>

            <Panel.Content className="Form section-block--body has-inputs-centered border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
              <FormField
                // @ts-ignore
                label="Database Password"
                type="password"
                placeholder="Type in a strong password"
                value={dbPass}
                onChange={onDbPassChange}
                description={
                  <>
                    {dbPass && (
                      <div
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={(PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore]}
                        aria-valuetext={
                          (PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore]
                        }
                        role="progressbar"
                        className="mb-2 bg-bg-alt-light dark:bg-bg-alt-dark rounded overflow-hidden transition-all border dark:border-dark"
                      >
                        <div
                          style={{
                            width: (PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore],
                          }}
                          className={`relative h-2 w-full ${
                            (PASSWORD_STRENGTH_COLOR as any)[passwordStrengthScore]
                          } transition-all duration-500 ease-out shadow-inner`}
                        ></div>
                      </div>
                    )}
                    <span
                      className={
                        passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH
                          ? 'text-green-600'
                          : ''
                      }
                    >
                      {passwordStrengthMessage
                        ? passwordStrengthMessage
                        : 'This is the password to your postgres database, so it must be a strong password and hard to guess.'}
                    </span>
                  </>
                }
                errorMessage={
                  passwordStrengthWarning
                    ? `${passwordStrengthWarning}. ${passwordErrorMessage}.`
                    : passwordErrorMessage
                }
              />
            </Panel.Content>

            <Panel.Content className="Form section-block--body has-inputs-centered border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
              <FormField
                // @ts-ignore
                label="Region"
                type="select"
                choices={REGIONS}
                value={dbRegion}
                onChange={onDbRegionChange}
                description="Select a region close to you for the best performance."
              />
            </Panel.Content>

            <Panel.Content className="Form section-block--body has-inputs-centered ">
              <Listbox
                label="Pricing Plan"
                layout="horizontal"
                value={dbPricingPlan}
                onChange={onDbPricingPlanChange}
                // @ts-ignore
                descriptionText={
                  <>
                    Select a pricing plan.&nbsp;
                    <a className="underline" target="_blank" href="https://supabase.com/pricing">
                      More details
                    </a>
                  </>
                }
              >
                {Object.entries(PRICING_PLANS).map(([k, v]) => (
                  <Listbox.Option
                    key={k}
                    label={v}
                    value={v}
                    addOnBefore={() => <IconDollarSign />}
                  >
                    {v}
                  </Listbox.Option>
                ))}
              </Listbox>

              <FreeProjectLimitWarning />
              <EmptyPaymentMethodWarning />
            </Panel.Content>
          </>
        </>
      </Panel>
    </WizardLayout>
  )
})

const FreeProjectLimitWarning = observer(() => {
  const _pageState = useContext(PageContext)
  if (!_pageState.isOverFreeProjectLimit) return null
  return (
    <InformationBox
      icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
      defaultVisibility={true}
      hideCollapse
      title="This organization has reached its free project limit"
      description={
        <div className="space-y-3">
          <p className="text-sm leading-normal">
            This organization can only have a maximum of {_pageState.currentOrg?.project_limit} free
            projects. You can only choose paid pricing plan.
          </p>
        </div>
      }
    />
  )
})

const EmptyPaymentMethodWarning = observer(() => {
  const _pageState = useContext(PageContext)
  const router = useRouter()
  const { ui } = useStore()

  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Get a link and then redirect them
   * path is used to determine what path inside billing portal to redirect to
   */
  async function redirectToPortal(path: any) {
    try {
      setLoading(true)
      let { billingPortal } = await post(`${API_URL}/stripe/billing`, {
        stripe_customer_id: _pageState.stripeCustomerId,
        returnTo: `${getURL()}${router.asPath}`,
      })
      window.location.replace(billingPortal + (path ? path : null))
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to redirect: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  if (!_pageState.isEmptyPaymentMethod) return null
  return (
    <div className="mt-4">
      <InformationBox
        icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
        defaultVisibility={true}
        hideCollapse
        title="No payment methods"
        description={
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              You are required to add a default payment method in order to create a paid project.
            </p>
            <Button
              loading={loading}
              type="secondary"
              onClick={() => redirectToPortal('/payment-methods')}
            >
              Add a payment method
            </Button>
          </div>
        }
      />
    </div>
  )
})
