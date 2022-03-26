import { toast } from 'react-hot-toast'
import { createContext, useEffect, useContext, useRef, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { makeAutoObservable } from 'mobx'
import { debounce } from 'lodash'
import { Button, Input, Listbox, Typography } from '@supabase/ui'
import { Dictionary } from '@supabase/grid'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { passwordStrength } from 'lib/helpers'
import {
  PROVIDERS,
  REGIONS,
  REGIONS_DEFAULT,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  API_URL,
  PRICING_TIER_PRODUCT_IDS,
} from 'lib/constants'
import { VERCEL_INTEGRATION_CONFIGS } from 'lib/vercelConfigs'
import {
  createVercelEnv,
  fetchVercelProject,
  prepareVercelEvns,
} from 'components/to-be-cleaned/Integration/Vercel.utils'
import VercelIntegrationLayout from 'components/layouts/VercelIntegrationLayout'
import Loading from 'components/ui/Loading'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'

interface ISetupProjectStore {
  token: string
  teamId: string
  externalId: string
  configurationId: string
  next: string
  supabaseOrgId: string
  vercelProjectId: string
  selectedVercelProject?: Dictionary<any>
  supabaseProjectRef?: string
  loading: boolean

  queryParams: Dictionary<string>
  selectedVercelProjectUrl: string

  loadInitialData: () => void
}

class SetupProjectStore implements ISetupProjectStore {
  token: string = ''
  teamId: string = ''
  externalId: string = ''
  configurationId: string = ''
  next: string = ''
  supabaseOrgId: string = ''
  vercelProjectId: string = ''

  selectedVercelProject?: Dictionary<any>
  supabaseProjectRef?: string

  loading: boolean = true

  constructor() {
    makeAutoObservable(this)
  }

  // @ts-ignore
  get queryParams() {
    return {
      next: this.next,
      supabaseProjectRef: this.supabaseProjectRef,
    }
  }

  get selectedVercelProjectUrl() {
    if (
      !this.selectedVercelProject ||
      !this.selectedVercelProject?.alias ||
      this.selectedVercelProject?.alias?.length == 0
    ) {
      return ''
    } else {
      return `https://${this.selectedVercelProject?.alias[0].domain}`
    }
  }

  loadInitialData() {
    this.getQueryParams()
    this.getVercelProject()
  }

  getQueryParams() {
    const params = new URLSearchParams(window.location.search)
    this.configurationId = params.get('configurationId') as string
    this.vercelProjectId = params.get('vercelProjectId') as string
    this.next = params.get('next') as string
    this.externalId = params.get('external-id') as string
    this.token = params.get('token') as string
    this.teamId = params.get('teamId') as string
    this.supabaseOrgId = params.get('supabaseOrgId') as string
  }

  async getVercelProject() {
    const { data, error } = await fetchVercelProject({
      id: this.vercelProjectId,
      vercelTeamId: this.teamId,
      vercelToken: this.token,
    })
    if (error) {
      toast.error(error)
    } else {
      this.selectedVercelProject = data
    }
    this.loading = false
  }
}
const PageContext = createContext<ISetupProjectStore>(undefined!)

const SetupProject = () => {
  // @ts-ignore
  const _store: ISetupProjectStore = useLocalObservable(() => new SetupProjectStore())

  useEffect(() => {
    _store.loadInitialData()
  }, [])

  return (
    <PageContext.Provider value={_store}>
      <VercelIntegrationLayout>
        {_store.loading && <Connecting />}
        {!_store.loading && <CreateProject />}
      </VercelIntegrationLayout>
    </PageContext.Provider>
  )
}
export default observer(SetupProject)

const Connecting = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="w-32 flex items-center justify-center">
      <Loading />
    </div>
    <Typography.Text>
      <p>Connecting...</p>
    </Typography.Text>
  </div>
)

const CreateProject = observer(() => {
  const _store = useContext(PageContext)
  const router = useRouter()
  const { ui } = useStore()

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(-1)
  const [dbRegion, setDbRegion] = useState(REGIONS_DEFAULT)
  const [loading, setLoading] = useState(false)
  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  const canSubmit =
    projectName != '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion != ''

  function onProjectNameChange(e: ChangeEvent<HTMLInputElement>) {
    e.target.value = e.target.value.replace(/\./g, '')
    setProjectName(e.target.value)
  }

  function onDbPassChange(e: ChangeEvent<HTMLInputElement>) {
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

  async function checkPasswordStrength(value: string) {
    const { message, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthMessage(message)
  }

  async function createSupabaseProject(dbSql: string) {
    const data = {
      cloud_provider: PROVIDERS.AWS.id, // hardcoded for DB instances to be under AWS
      org_id: Number(_store.supabaseOrgId),
      name: projectName,
      db_pass: dbPass,
      db_region: dbRegion,
      db_sql: dbSql || '',
      db_pricing_tier_id: PRICING_TIER_PRODUCT_IDS.FREE,
      auth_site_url: _store.selectedVercelProjectUrl,
      vercel_configuration_id: _store.configurationId,
    }
    return await post(`${API_URL}/projects`, data)
  }

  async function onCreateProject() {
    setLoading(true)

    try {
      const requiredEnvs =
        VERCEL_INTEGRATION_CONFIGS.find((x) => x.id == _store.externalId)?.envs || []
      const dbSql =
        VERCEL_INTEGRATION_CONFIGS.find((x) => x.id == _store.externalId)?.template?.sql || ''

      const response = await createSupabaseProject(dbSql)
      if (response.error) {
        setLoading(false)
        ui.setNotification({
          category: 'error',
          message: `Failed to create project: ${response.error.message}`,
        })
        return
      }

      const project = response
      _store.supabaseProjectRef = project.ref

      const envs = prepareVercelEvns(requiredEnvs, project)

      await Promise.allSettled(
        envs.map(async (env: any) => {
          try {
            const data = await createVercelEnv({
              ...env,
              vercelProjectId: _store.selectedVercelProject?.id,
              vercelTeamId: _store.teamId,
              vercelToken: _store.token,
            })
            return data
          } catch (err) {
            console.error(`Error: ${err}`)
          }
        })
      )

      const query = new URLSearchParams(_store.queryParams).toString()
      router.push(`/vercel/complete?${query}`)
    } catch (error) {
      console.log('error', error)
      setLoading(false)
    }
  }

  return (
    <div className="">
      <p className="mb-2">Project details for integration</p>
      <div className="py-2">
        <Input
          autoFocus
          id="projectName"
          label="Project name"
          type="text"
          placeholder=""
          descriptionText=""
          value={projectName}
          onChange={onProjectNameChange}
        />
      </div>
      <div className="py-2">
        <Input
          id="dbPass"
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
        />
      </div>
      <div className="py-2 pb-4">
        <div className="mt-1">
          <Listbox
            label="Region"
            type="select"
            value={dbRegion}
            onChange={onDbRegionChange}
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
        </div>
      </div>
      <Button disabled={loading || !canSubmit} loading={loading} onClick={onCreateProject}>
        Create project
      </Button>
    </div>
  )
})
