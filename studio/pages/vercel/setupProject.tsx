import { toast } from 'react-hot-toast'
import { createContext, useEffect, useContext, useRef, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { makeAutoObservable } from 'mobx'
import { debounce } from 'lodash'
import { Button, Typography } from '@supabase/ui'
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

const PASSWORD_STRENGTH = {
  0: "That's terrible.",
  1: 'Pathetic.',
  2: 'Weak.',
  3: 'Not bad. Can you do better?',
  4: "Strong. Let's get started!",
}

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

  function onDbRegionChange(e: ChangeEvent<HTMLSelectElement>) {
    setDbRegion(e.target.value)
  }

  async function checkPasswordStrength(value: string) {
    const { message, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthMessage(message)
  }

  async function createSupabaseProject(dbSql: string) {
    const data = {
      cloud_provider: PROVIDERS.AWS.id, // hardcoded for DB instances to be under AWS
      org_id: _store.supabaseOrgId,
      name: projectName,
      db_pass: dbPass,
      db_region: dbRegion,
      db_sql: dbSql || '',
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

      // console.log('new project', project)
      const envs = prepareVercelEvns(requiredEnvs, project)
      // console.log('envs', envs)

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
      <Typography.Title level={3}>Project details for integration</Typography.Title>
      <div className="py-2">
        <label htmlFor="projectName" className="block w-full text-base normal-case">
          Project name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="projectName"
            id="projectName"
            value={projectName}
            onChange={onProjectNameChange}
            placeholder="Project name"
            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="py-2">
        <label htmlFor="dbPass" className="block w-full text-base normal-case">
          Database password
        </label>
        <div className="mt-1 space-y-2">
          <input
            type="password"
            name="dbPass"
            id="dbPass"
            value={dbPass}
            onChange={onDbPassChange}
            placeholder="· · · · · · · · · · · · ·"
            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
          <PasswordStrengthBar
            password={dbPass}
            passwordStrengthScore={passwordStrengthScore}
            passwordStrengthMessage={passwordStrengthMessage}
          />
        </div>
      </div>
      <div className="py-2 pb-4">
        <label htmlFor="projectName" className="block w-full text-base normal-case">
          Database region
        </label>
        <div className="mt-1">
          <select
            id="dbRegion"
            name="dbRegion"
            value={dbRegion}
            onChange={onDbRegionChange}
            className="focus:ring-green-500 focus:border-green-500 relative block w-full rounded-md bg-transparent focus:z-10 sm:text-sm border-gray-300"
          >
            {Object.keys(REGIONS).map((choice) => {
              return (
                <option
                  key={(REGIONS as any)[choice]}
                  value={(REGIONS as any)[choice]}
                  className="text-black"
                >
                  {(REGIONS as any)[choice]}
                </option>
              )
            })}
          </select>
          <Typography.Text type="secondary">
            <p className="pt-2">Select a region close to you for the best performance.</p>
          </Typography.Text>
        </div>
      </div>
      <Button disabled={loading || !canSubmit} loading={loading} onClick={onCreateProject}>
        Create project
      </Button>
    </div>
  )
})
