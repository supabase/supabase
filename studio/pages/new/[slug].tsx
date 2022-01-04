/**
 * Org is selected, creating a new project
 */

import Router, { useRouter } from 'next/router'
import { useRef, useState, useEffect } from 'react'
import { debounce, isUndefined, values } from 'lodash'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
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
  DEFAULT_FREE_PROJECTS_LIMIT,
} from 'lib/constants'

import { useStore, withAuth } from 'hooks'
import { WizardLayout } from 'components/layouts'
import { getURL } from 'lib/helpers'

import FormField from 'components/to-be-cleaned/forms/FormField'
import Panel from 'components/to-be-cleaned/Panel'
import InformationBox from 'components/ui/InformationBox'

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

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [dbRegion, setDbRegion] = useState(REGIONS_DEFAULT)
  const [dbPricingPlan, setDbPricingPlan] = useState(PRICING_PLANS_DEFAULT)
  const [newProjectedLoading, setNewProjectLoading] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)
  const [stripeCustomer, setStripeCustomer] = useState<StripeCustomer | undefined>(undefined)

  const organizations = values(toJS(app.organizations.list()))
  const currentOrg = organizations.find((o: any) => o.slug === slug)
  const stripeCustomerId = currentOrg?.stripe_customer_id

  const totalFreeProjects = ui.profile?.total_free_projects ?? 0
  const freeProjectsLimit = ui.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT

  const isEmptyOrganizations = organizations.length <= 0
  const isEmptyPaymentMethod = stripeCustomer
    ? stripeCustomer.paymentMethods?.data?.length <= 0
    : undefined
  const isOverFreeProjectLimit = totalFreeProjects >= freeProjectsLimit
  const isInvalidSlug = isUndefined(currentOrg)
  const isSelectFreeTier = dbPricingPlan === PRICING_PLANS.FREE

  const canCreateProject =
    currentOrg?.is_owner &&
    (!isSelectFreeTier || (isSelectFreeTier && !isOverFreeProjectLimit && !isEmptyPaymentMethod))

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
      org_id: currentOrg?.id,
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
    <WizardLayout organization={currentOrg} project={null}>
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

            {!currentOrg?.is_owner ? (
              <NotOrganizationOwnerWarning />
            ) : (
              <>
                {isSelectFreeTier && isOverFreeProjectLimit && <FreeProjectLimitWarning />}
                {!isSelectFreeTier && isEmptyPaymentMethod && (
                  <EmptyPaymentMethodWarning stripeCustomerId={stripeCustomerId} />
                )}
              </>
            )}
          </Panel.Content>

          {canCreateProject && (
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
                          aria-valuenow={
                            (PASSWORD_STRENGTH_PERCENTAGE as any)[passwordStrengthScore]
                          }
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
                      Select a plan that suits your needs.&nbsp;
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
                      {`${v}${
                        v === PRICING_PLANS.PRO
                          ? ' - $25/month'
                          : v === PRICING_PLANS.PAYG
                          ? ' - $25/month plus usage costs'
                          : ''
                      }`}
                    </Listbox.Option>
                  ))}
                </Listbox>
              </Panel.Content>
            </>
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
              Only the organization owner can create new projects. Contact your organizaton owner to
              create a new project for this organization.
            </p>
          </div>
        }
      />
    </div>
  )
}

const FreeProjectLimitWarning = () => {
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
              Your account can only have a maximum of 2 free projects. You can only choose paid
              pricing plan.
            </p>
          </div>
        }
      />
    </div>
  )
}

const EmptyPaymentMethodWarning = observer(
  ({ stripeCustomerId }: { stripeCustomerId: string | undefined }) => {
    const router = useRouter()
    const { ui } = useStore()

    const [loading, setLoading] = useState<boolean>(false)

    /**
     * Get a link and then redirect them
     * path is used to determine what path inside billing portal to redirect to
     */
    async function redirectToPortal(path?: any) {
      if (stripeCustomerId) {
        setLoading(true)
        const response = await post(`${API_URL}/stripe/checkout`, {
          stripe_customer_id: stripeCustomerId,
          returnTo: `${getURL()}${router.asPath}`,
        })
        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to redirect: ${response.error.message}`,
          })
          setLoading(false)
        } else {
          const { setupCheckoutPortal } = response
          window.location.replace(`${setupCheckoutPortal}${path ? path : ''}`)
        }
      } else {
        ui.setNotification({
          category: 'error',
          message: `Invalid customer id`,
        })
      }
    }
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
                It's required to add a payment method for your organization before creating a paid
                project.
              </p>
              <Button loading={loading} type="secondary" onClick={() => redirectToPortal()}>
                Add a payment method
              </Button>
            </div>
          }
        />
      </div>
    )
  }
)
