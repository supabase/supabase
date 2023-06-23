import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useIntegrationConnectionsCreateMutation } from 'data/integrations/integration-connections-create-mutation'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { Integration } from 'data/integrations/integrations.types'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import generator from 'generate-password'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import {
  API_URL,
  AWS_REGIONS,
  DEFAULT_MINIMUM_PASSWORD_STRENGTH,
  PRICING_TIER_PRODUCT_IDS,
  PROVIDERS,
} from 'lib/constants'
import { passwordStrength } from 'lib/helpers'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { ChangeEvent, useRef, useState } from 'react'
import { NextPageWithLayout } from 'types'
import { Alert, Button, IconBook, IconLifeBuoy, Input, Listbox, LoadingLine } from 'ui'

const VercelIntegration: NextPageWithLayout = () => {
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={loading} />

        <>
          <ScaffoldContainer className="max-w-md flex flex-col gap-6 grow py-8">
            <h1 className="text-xl text-scale-1200">New project</h1>
            <>
              <Markdown content={`Choose the Supabase Organization you wish to install to`} />
              <CreateProject setLoading={(e: boolean) => setLoading(e)} />
            </>
          </ScaffoldContainer>
          <ScaffoldContainer className="flex flex-col gap-6 py-3">
            <Alert withIcon variant="info" title="You can uninstall this Integration at any time.">
              <Markdown
                content={`You can remove this integration at any time either via Vercel or the Supabase dashboard.`}
              />
            </Alert>
          </ScaffoldContainer>
        </>

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-body flex flex-row gap-6 py-6 border-t">
        <div className="flex items-center gap-2 text-xs text-scale-900">
          <IconBook size={16} /> Docs
        </div>
        <div className="flex items-center gap-2 text-xs text-scale-900">
          <IconLifeBuoy size={16} /> Support
        </div>
      </ScaffoldContainer>
    </>
  )
}

VercelIntegration.getLayout = (page) => <IntegrationWindowLayout>{page}</IntegrationWindowLayout>

const CreateProject = ({ setLoading }: { setLoading: (e: boolean) => void }) => {
  const router = useRouter()
  const { ui } = useStore()
  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(-1)
  const [dbRegion, setDbRegion] = useState(PROVIDERS.AWS.default_region)
  // const [loading, setLoading] = useState(false)
  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  const { configurationId, next, currentProjectId: foreignProjectId } = useParams()

  const { mutateAsync: createConnections, isLoading: isLoadingCreateConnections } =
    useIntegrationConnectionsCreateMutation({})

  const { data: organizationData, isLoading: isLoadingOrganizationsQuery } = useOrganizationsQuery()
  const { slug } = router.query

  console.log('slug')

  const organization = organizationData?.find((x) => x.slug === slug)

  /**
   * array of integrations installed
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useIntegrationsQuery({})

  /**
   * the vercel integration installed for organization chosen
   */
  const organizationIntegration: Integration | undefined = integrationData?.find(
    (x) => x.organization.slug === slug
  )

  /**
   * Vercel projects available for this integration
   */
  const { data: vercelProjects } = useVercelProjectsQuery(
    {
      organization_integration_id: organizationIntegration?.id,
    },
    { enabled: organizationIntegration !== undefined }
  )

  console.log('vercelProjects near top', vercelProjects)

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

  function generateStrongPassword() {
    const password = generator.generate({
      length: 16,
      numbers: true,
      uppercase: true,
    })

    setDbPass(password)
    delayedCheckPasswordStrength(password)
  }

  async function createSupabaseProject(dbSql?: string) {
    const data = {
      cloud_provider: PROVIDERS.AWS.id, // hardcoded for DB instances to be under AWS
      org_id: organization?.id,
      name: projectName,
      db_pass: dbPass,
      db_region: dbRegion,
      // db_sql: dbSql || '',
      db_pricing_tier_id: PRICING_TIER_PRODUCT_IDS.FREE,
      // auth_site_url: _store.selectedVercelProjectUrl,
      vercel_configuration_id: configurationId,
    }
    const project = await post(`${API_URL}/projects`, data)
    return { ...project, db_host: `db.${project.ref}.supabase.co`, db_password: dbPass }
  }

  async function onCreateProject() {
    setLoading(true)

    if (!organizationIntegration) {
      console.error('No organizationIntegration set')
      return
    }

    if (!foreignProjectId) {
      console.error('No foreignProjectId ID set')
      return
    }

    if (!configurationId) {
      console.error('No configurationId ID set')
      return
    }

    try {
      const response = await createSupabaseProject()
      // dbSql

      if (response.error) {
        setLoading(false)
        ui.setNotification({
          category: 'error',
          message: `Failed to create project: ${response.error.message}`,
        })
        return
      }

      const project = response

      console.log('vercelProjects before projectDetails', vercelProjects)
      const projectDetails = vercelProjects?.find((x) => x.id === foreignProjectId)

      console.log('projectDetails', projectDetails)
      console.log(project)
      console.log('supabase_project_ref', project.ref)

      // Introduce a wait of 10 seconds
      try {
        await new Promise((resolve) => setTimeout(resolve, 10000))
      } catch (error) {
        console.error('An error occurred during the delay:', error)
      }

      // Wrap the createConnections function call in a try-catch block
      try {
        await createConnections({
          organizationIntegrationId: organizationIntegration?.id,
          connection: {
            foreign_project_id: foreignProjectId,
            supabase_project_ref: project.ref,
            metadata: {
              ...projectDetails,
              supabaseConfig: {
                projectEnvVars: {
                  write: true,
                },
              },
            },
          },
          orgSlug: ui.selectedOrganization?.slug,
        })
      } catch (error) {
        console.error('An error occurred during createConnections:', error)
      }

      // const query = new URLSearchParams(_store.queryParams).toString()
      // router.push(`/vercel/complete?${query}`)

      if (next) {
        window.location.href = next
      }
    } catch (error) {
      console.error('Error', error)
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
          copy={dbPass.length > 0}
          onChange={onDbPassChange}
          descriptionText={
            <PasswordStrengthBar
              passwordStrengthScore={passwordStrengthScore}
              password={dbPass}
              passwordStrengthMessage={passwordStrengthMessage}
              generateStrongPassword={generateStrongPassword}
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
              const label = Object.values(AWS_REGIONS)[i]
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
                  <span className="text-scale-1200">{label}</span>
                </Listbox.Option>
              )
            })}
          </Listbox>
        </div>
      </div>
      <div className="flex flex-row w-full justify-end">
        <Button
          size="medium"
          className="self-end"
          // disabled={isLoading}
          // loading={isLoading}
          onClick={onCreateProject}
        >
          Create Project
        </Button>
      </div>
      {/* <Button disabled={loading || !canSubmit} loading={loading} onClick={onCreateProject}>
        Create project
      </Button> */}
    </div>
  )
}

export default VercelIntegration
