import { useParams } from 'common'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert, Button, Checkbox, Input, Listbox } from 'ui'

import { isVercelUrl } from 'components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import { Markdown } from 'components/interfaces/Markdown'
import VercelIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/VercelIntegrationWindowLayout'
import { ScaffoldColumn, ScaffoldContainer } from 'components/layouts/Scaffold'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useIntegrationVercelConnectionsCreateMutation } from 'data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectCreateMutation } from 'data/projects/project-create-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PROVIDERS } from 'lib/constants'
import { getInitialMigrationSQLFromGitHubRepo } from 'lib/integration-utils'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { AWS_REGIONS } from 'shared-data'
import { useIntegrationInstallationSnapshot } from 'state/integration-installation'
import type { NextPageWithLayout } from 'types'

const VercelIntegration: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
        <ScaffoldColumn className="mx-auto w-full max-w-md">
          <header>
            <h2>New project</h2>
            <Markdown
              className="text-foreground-light"
              content={`Choose the Supabase organization you wish to install in`}
            />
          </header>
          <CreateProject />
          <Alert withIcon variant="info" title="You can uninstall this Integration at any time.">
            <Markdown
              content={`You can remove this integration at any time via Vercel or the Supabase dashboard.`}
            />
          </Alert>
        </ScaffoldColumn>
      </ScaffoldContainer>
    </>
  )
}

VercelIntegration.getLayout = (page) => (
  <VercelIntegrationWindowLayout>{page}</VercelIntegrationWindowLayout>
)

const CreateProject = () => {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(-1)
  const [shouldRunMigrations, setShouldRunMigrations] = useState(true)
  const [dbRegion, setDbRegion] = useState(PROVIDERS.AWS.default_region.displayName)

  const snapshot = useIntegrationInstallationSnapshot()

  const delayedCheckPasswordStrength = useRef(
    debounce((value: string) => checkPasswordStrength(value), 300)
  ).current

  const { slug, next, currentProjectId: foreignProjectId, externalId } = useParams()

  const { mutateAsync: createConnections } = useIntegrationVercelConnectionsCreateMutation()

  const { data: organizationData } = useOrganizationsQuery()
  const organization = organizationData?.find((x) => x.slug === slug)

  /**
   * array of integrations installed
   */
  const { data: integrationData } = useIntegrationsQuery()

  /**
   * the vercel integration installed for organization chosen
   */
  const organizationIntegration = integrationData?.find((x) => x.organization.slug === slug)

  /**
   * Vercel projects available for this integration
   */
  const { data: vercelProjects } = useVercelProjectsQuery(
    {
      organization_integration_id: organizationIntegration?.id,
    },
    { enabled: organizationIntegration !== undefined }
  )

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

  const [newProjectRef, setNewProjectRef] = useState<string | undefined>(undefined)

  const { mutate: createProject } = useProjectCreateMutation({
    onSuccess: (res) => {
      setNewProjectRef(res.ref)
    },
    onError: (error) => {
      toast.error(error.message)
      snapshot.setLoading(false)
    },
  })

  async function onCreateProject() {
    if (!organizationIntegration) return console.error('No organization installation details found')
    if (!organizationIntegration?.id) return console.error('No organization installation ID found')
    if (!foreignProjectId) return console.error('No foreignProjectId set')
    if (!organization) return console.error('No organization set')

    snapshot.setLoading(true)

    let dbSql: string | undefined
    if (shouldRunMigrations) {
      const id = toast(`Fetching initial migrations from GitHub repo`)
      dbSql = (await getInitialMigrationSQLFromGitHubRepo(externalId)) ?? undefined
      toast.success(`Done fetching initial migrations`, { id })
    }

    createProject({
      organizationSlug: organization.slug,
      name: projectName,
      dbPass,
      dbRegion,
      dbSql,
    })
  }

  // Wait for the new project to be created before creating the connection
  useProjectSettingsV2Query(
    { projectRef: newProjectRef },
    {
      enabled: newProjectRef !== undefined,
      // refetch until the project is created
      refetchInterval: (data) => {
        return ((data?.service_api_keys ?? []).length ?? 0) > 0 ? false : 1000
      },
      async onSuccess(data) {
        const isReady = (data?.service_api_keys ?? []).length > 0

        if (!isReady || !organizationIntegration || !foreignProjectId || !newProjectRef) {
          return
        }

        const projectDetails = vercelProjects?.find((x: any) => x.id === foreignProjectId)

        try {
          const { id: connectionId } = await createConnections({
            organizationIntegrationId: organizationIntegration?.id,
            connection: {
              foreign_project_id: foreignProjectId,
              supabase_project_ref: newProjectRef,
              integration_id: '0',
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

        snapshot.setLoading(false)

        if (next && isVercelUrl(next)) {
          window.location.href = next
        }
      },
    }
  )

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
      <div className="py-2 pb-4">
        <Checkbox
          name="shouldRunMigrations"
          label="Create sample tables with seed data"
          description="To get you started quickly, we can create new tables for you with seed (sample) data. You can delete these tables later."
          checked={shouldRunMigrations}
          onChange={(e) => setShouldRunMigrations(e.target.checked)}
        />
      </div>
      <div className="flex flex-row w-full justify-end">
        <Button
          size="medium"
          className="self-end"
          disabled={snapshot.loading}
          loading={snapshot.loading}
          onClick={onCreateProject}
        >
          Create Project
        </Button>
      </div>
    </div>
  )
}

export default VercelIntegration
