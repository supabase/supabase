import { debounce } from 'lodash'
import { makeAutoObservable } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { ChangeEvent, createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import VercelIntegrationLayout from 'components/layouts/VercelIntegrationLayout'
import {
  createVercelEnv,
  fetchVercelProject,
  prepareVercelEvns,
} from 'components/to-be-cleaned/Integration/Vercel.utils'
import { Loading } from 'components/ui/Loading'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useProjectCreateMutation } from 'data/projects/project-create-mutation'
import {
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  PRICING_TIER_PRODUCT_IDS,
  PROVIDERS,
} from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { VERCEL_INTEGRATION_CONFIGS } from 'lib/vercelConfigs'
import { AWS_REGIONS } from 'shared-data'
import type { Dictionary } from 'types'
import { Button, Input, Listbox } from 'ui'

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
  <div className="flex h-full w-full flex-col items-center justify-center">
    <div className="flex w-32 items-center justify-center">
      <Loading />
    </div>
    <p>Connecting...</p>
  </div>
)

const CreateProject = observer(() => {
  const router = useRouter()
  const _store = useContext(PageContext)

  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(-1)
  const [dbRegion, setDbRegion] = useState(PROVIDERS.AWS.default_region.displayName)

  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  const { mutate: createProject, isLoading } = useProjectCreateMutation({
    onSuccess: async (res) => {
      const project = { ...res, db_host: `db.${res.ref}.supabase.co`, db_password: dbPass }
      _store.supabaseProjectRef = project.ref

      const requiredEnvs =
        VERCEL_INTEGRATION_CONFIGS.find((x) => x.id == _store.externalId)?.envs || []
      const envs = prepareVercelEvns(requiredEnvs, project as any)

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
    },
  })

  const canSubmit =
    projectName != '' &&
    passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH &&
    dbRegion != undefined

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

  async function checkPasswordStrength(value: string) {
    const { message, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthMessage(message)
  }

  function generatePassword() {
    const password = generateStrongPassword()
    setDbPass(password)
    delayedCheckPasswordStrength(password)
  }

  async function onCreateProject() {
    try {
      const dbSql =
        VERCEL_INTEGRATION_CONFIGS.find((x) => x.id == _store.externalId)?.template?.sql || ''

      createProject({
        cloudProvider: PROVIDERS.AWS.id,
        organizationId: Number(_store.supabaseOrgId),
        name: projectName,
        dbPass: dbPass,
        dbRegion,
        dbSql: dbSql || '',
        dbPricingTierId: PRICING_TIER_PRODUCT_IDS.FREE,
        authSiteUrl: _store.selectedVercelProjectUrl,
      })
    } catch (error) {
      console.error('Error', error)
    }
  }

  return (
    <div>
      <p className="mb-2">Supabase project details</p>
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
          copy={dbPass.length > 0}
          onChange={onDbPassChange}
          descriptionText={
            <PasswordStrengthBar
              passwordStrengthScore={passwordStrengthScore}
              password={dbPass}
              passwordStrengthMessage={passwordStrengthMessage}
              generateStrongPassword={generatePassword}
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
            onChange={(region) => setDbRegion(region)}
            descriptionText="Select a region close to your users for the best performance."
          >
            {Object.keys(AWS_REGIONS).map((option: string, i) => {
              const label = Object.values(AWS_REGIONS)[i].displayName
              return (
                <Listbox.Option
                  key={option}
                  label={label}
                  value={label}
                  addOnBefore={({ active, selected }: any) => (
                    <img
                      alt="region icon"
                      className="w-5 rounded-sm"
                      src={`${router.basePath}/img/regions/${Object.keys(AWS_REGIONS)[i]}.svg`}
                    />
                  )}
                >
                  <span className="text-foreground">{label}</span>
                </Listbox.Option>
              )
            })}
          </Listbox>
        </div>
      </div>
      <Button disabled={isLoading || !canSubmit} loading={isLoading} onClick={onCreateProject}>
        Create project
      </Button>
    </div>
  )
})
