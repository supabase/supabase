import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { ChangeEvent, useRef, useState } from 'react'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useIntegrationConnectionsCreateMutation } from 'data/integrations/integration-connections-create-mutation'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { Integration } from 'data/integrations/integrations.types'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectCreateMutation } from 'data/projects/project-create-mutation'
import generator from 'generate-password'
import { useSelectedOrganization, useStore } from 'hooks'
import { AWS_REGIONS, DEFAULT_MINIMUM_PASSWORD_STRENGTH, PROVIDERS } from 'lib/constants'
import { passwordStrength } from 'lib/helpers'
import { getInitialMigrationSQLFromGitHubRepo } from 'lib/integration-utils'
import { NextPageWithLayout, ProjectBase } from 'types'
import { Alert, Button, Checkbox, IconBook, IconLifeBuoy, Input, Listbox, LoadingLine } from 'ui'

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
              <CreateProject loading={loading} setLoading={setLoading} />
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

const CreateProject = ({
  loading,
  setLoading,
}: {
  loading: boolean
  setLoading: (e: boolean) => void
}) => {
  const router = useRouter()
  const { ui } = useStore()
  const selectedOrganization = useSelectedOrganization()
  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(-1)
  const [shouldRunMigrations, setShouldRunMigrations] = useState(true)
  const [dbRegion, setDbRegion] = useState(PROVIDERS.AWS.default_region)
  // const [loading, setLoading] = useState(false)
  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  const {
    slug,
    configurationId,
    next,
    currentProjectId: foreignProjectId,
    externalId,
  } = useParams()

  const { mutateAsync: createConnections, isLoading: isLoadingCreateConnections } =
    useIntegrationConnectionsCreateMutation({})

  const { data: organizationData, isLoading: isLoadingOrganizationsQuery } = useOrganizationsQuery()

  const organization = organizationData?.find((x) => x.slug === slug)

  /**
   * array of integrations installed
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useIntegrationsQuery()

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

  const { mutateAsync: createProject } = useProjectCreateMutation()

  const [newProjectRef, setNewProjectRef] = useState<string | undefined>(undefined)
  async function onCreateProject() {
    if (!organizationIntegration) {
      console.error('No organization installation details found')
    }

    if (!organizationIntegration?.id) {
      console.error('No organization installation ID found')
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

    setLoading(true)

    try {
      if (!organization) {
        throw new Error('No organization set')
      }

      let dbSql: string | undefined
      if (shouldRunMigrations) {
        const id = ui.setNotification({
          category: 'info',
          message: `Fetching initial migrations from GitHub repo`,
        })

        dbSql = (await getInitialMigrationSQLFromGitHubRepo(externalId)) ?? undefined

        ui.setNotification({
          id,
          category: 'success',
          message: `Done fetching initial migrations`,
        })
      }

      let project: ProjectBase

      try {
        project = await createProject({
          organizationId: organization.id,
          name: projectName,
          dbPass,
          dbRegion,
          dbSql,
          configurationId,
        })

        setNewProjectRef(project.ref)
      } catch (error: any) {
        setLoading(false)
        ui.setNotification({
          category: 'error',
          message: `Failed to create project: ${error.message}`,
        })
        return
      }
    } catch (error) {
      console.error('Error', error)
      setLoading(false)
    }
  }
  const isInstallingRef = useRef(false)

  // Wait for the new project to be created before creating the connection
  useProjectApiQuery(
    { projectRef: newProjectRef },
    {
      enabled: newProjectRef !== undefined,
      // refetch until the project is created
      refetchInterval: (data) => {
        return (data?.autoApiService.service_api_keys.length ?? 0) > 0 ? false : 1000
      },
      async onSuccess(data) {
        const isReady = data.autoApiService.service_api_keys.length > 0

        if (
          !isReady ||
          !organizationIntegration ||
          !foreignProjectId ||
          !newProjectRef ||
          isInstallingRef.current
        ) {
          return
        }
        isInstallingRef.current = true

        const projectDetails = vercelProjects?.find((x) => x.id === foreignProjectId)

        // Wrap the createConnections function call in a try-catch block
        try {
          await createConnections({
            organizationIntegrationId: organizationIntegration?.id,
            connection: {
              foreign_project_id: foreignProjectId,
              supabase_project_ref: newProjectRef,
              metadata: {
                ...projectDetails,
                supabaseConfig: {
                  projectEnvVars: {
                    write: true,
                  },
                },
              },
            },
            orgSlug: selectedOrganization?.slug,
          })
        } catch (error) {
          console.error('An error occurred during createConnections:', error)
          return
        }

        setLoading(false)

        if (next) {
          window.location.href = next
        }
      },
    }
  )

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
      <div className="py-2">
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
      <div className="py-2 pb-4">
        <Checkbox
          name="shouldRunMigrations"
          label="Run migrations & seed.sql"
          description="If your repository has migrations under supabase/migrations, they will be run automatically."
          checked={shouldRunMigrations}
          onChange={(e) => setShouldRunMigrations(e.target.checked)}
        />
      </div>
      <div className="flex flex-row w-full justify-end">
        <Button
          size="medium"
          className="self-end"
          disabled={loading}
          loading={loading}
          onClick={onCreateProject}
        >
          Create Project
        </Button>
      </div>
    </div>
  )
}

export default VercelIntegration
