/**
 * Org is selected, creating a new project
 */

import { useRef, useState, createContext, useContext } from 'react'
import Router, { useRouter } from 'next/router'
import { debounce, values } from 'lodash'
import { makeAutoObservable, toJS } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { Dictionary } from '@supabase/grid'
import { Button, Typography, Listbox, IconUsers, IconAlertCircle } from '@supabase/ui'

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
} from 'lib/constants'

import { useStore, withAuth } from 'hooks'
import { WizardLayout } from 'components/layouts'
import FormField from 'components/to-be-cleaned/forms/FormField'
import Panel from 'components/to-be-cleaned/Panel'
import InformationBox from 'components/ui/InformationBox'

interface IHomePageStore {
  store: any
  projectOrganizations: Dictionary<any>[]
}
class HomePageStore implements IHomePageStore {
  store: any

  constructor(store: any) {
    makeAutoObservable(this)
    this.store = store
  }

  get projectOrganizations() {
    const projects = values(this.store?.projects?.data) ?? []
    const orgIds = projects.map((x: any) => x.organization_id)
    const temp = values(this.store?.organizations?.data) ?? []
    return temp
      .filter((x: any) => orgIds.includes(x.id))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }
}
const PageContext = createContext<IHomePageStore>(undefined!)

export const PageLayout = () => {
  const store = useStore()
  const _pageState = useLocalObservable(() => new HomePageStore(store))

  return (
    <PageContext.Provider value={_pageState}>
      <Wizard />
    </PageContext.Provider>
  )
}

export default withAuth(observer(PageLayout))

export const Wizard = () => {
  const _pageState = useContext(PageContext)

  const router = useRouter()
  const { slug } = router.query

  const { ui } = useStore()

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [dbRegion, setDbRegion] = useState(REGIONS_DEFAULT)
  const [newProjectedLoading, setNewProjectLoading] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)

  const canSubmit =
    projectName != '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion != ''
  const passwordErrorMessage =
    dbPass != '' && passwordStrengthScore < DEFAULT_MINIMUM_PASSWORD_STRENGTH
      ? 'You need a stronger password'
      : undefined

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  const organizations: any = Object.values(toJS(_pageState.store.app.organizations.list()))

  /*
   * Handle no org
   * redirect to new org route
   */
  if (organizations.length <= 0) {
    router.push(`/new`)
  }

  /*
   * Handle org slug redirect
   */
  const found = organizations.find((o: any) => o.slug === slug)

  /*
   * Redirect to first org if the slug doesn't match an org slug
   * this is mainly to capture the /project/new url, which is redirected from database.new
   */
  if (!found) {
    router.push(`/new/${organizations[0].slug}`)
  }

  /*
   * currentOrg can now be used for any org meta data and for creating new project
   */
  const currentOrg = organizations.find((o: any) => o.slug === slug)

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
      org_id: currentOrg.id,
      name: projectName,
      db_pass: dbPass,
      db_region: dbRegion,
    }
    const response = await post(`${API_URL}/projects/new`, data)
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

  const overProjectLimit = currentOrg?.total_free_projects >= currentOrg?.project_limit
  const sortedOrganizations = organizations.sort((a: any, b: any) => a.name.localeCompare(b.name))

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
              {sortedOrganizations.map((x: any) => (
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

            {overProjectLimit && (
              <InformationBox
                icon={<IconAlertCircle className="text-white" size="large" strokeWidth={1.5} />}
                defaultVisibility={true}
                hideCollapse
                title="This organization has reached its project limit"
                description={
                  <div className="space-y-3">
                    <p className="text-sm leading-normal">
                      This organization can only have a maximum of {currentOrg.project_limit} free
                      projects. You can either upgrade pre existing projects, choose another
                      organization, or create a new organization.
                    </p>
                    <Button type="secondary" onClick={() => router.push('/new')}>
                      New organization
                    </Button>
                  </div>
                }
              />
            )}
          </Panel.Content>

          {!overProjectLimit && (
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

              <Panel.Content className="Form section-block--body has-inputs-centered ">
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
            </>
          )}
        </>
      </Panel>
    </WizardLayout>
  )
}
