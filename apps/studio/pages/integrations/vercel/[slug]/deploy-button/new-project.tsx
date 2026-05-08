import { useParams } from 'common'
import { ChangeEvent, useEffect, useState } from 'react'
import { AWS_REGIONS } from 'shared-data'
import { toast } from 'sonner'
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { isVercelUrl } from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import { Markdown } from '@/components/interfaces/Markdown'
import VercelIntegrationWindowLayout from '@/components/layouts/IntegrationsLayout/VercelIntegrationWindowLayout'
import { ScaffoldColumn, ScaffoldContainer } from '@/components/layouts/Scaffold'
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useIntegrationsQuery } from '@/data/integrations/integrations-query'
import { useIntegrationVercelConnectionsCreateMutation } from '@/data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from '@/data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProjectCreateMutation } from '@/data/projects/project-create-mutation'
import {
  useDataApiRevokeOnCreateDefaultEnabled,
  useTrackDefaultPrivilegesExposure,
} from '@/hooks/misc/useDataApiRevokeOnCreateDefault'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { BASE_PATH, PROVIDERS } from '@/lib/constants'
import { getInitialMigrationSQLFromGitHubRepo } from '@/lib/integration-utils'
import { passwordStrength, PasswordStrengthScore } from '@/lib/password-strength'
import { generateStrongPassword } from '@/lib/project'
import { useTrack } from '@/lib/telemetry/track'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout } from '@/types'

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
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const [projectName, setProjectName] = useState('')
  const [dbPass, setDbPass] = useState('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(-1)
  const [shouldRunMigrations, setShouldRunMigrations] = useState(true)
  const [dbRegion, setDbRegion] = useState<string>(PROVIDERS.AWS.default_region.displayName)

  const track = useTrack()
  const snapshot = useIntegrationInstallationSnapshot()
  const isDataApiRevokeOnCreateDefault = useDataApiRevokeOnCreateDefaultEnabled()
  const dataApiRevokeOnCreateDefaultFlag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')
  const [dataApiDefaultPrivileges, setDataApiDefaultPrivileges] = useState(
    !isDataApiRevokeOnCreateDefault
  )

  useTrackDefaultPrivilegesExposure({ surface: 'vercel' })

  async function checkPasswordStrength(value: string) {
    const { message, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthMessage(message)
  }

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
    } else checkPasswordStrength(value)
  }

  function generatePassword() {
    const password = generateStrongPassword()
    setDbPass(password)
    checkPasswordStrength(password)
  }

  const [newProjectRef, setNewProjectRef] = useState<string | undefined>(undefined)

  const { mutate: createProject } = useProjectCreateMutation({
    onSuccess: (res) => {
      setNewProjectRef(res.ref)
      track(
        'project_creation_simple_version_submitted',
        {
          surface: 'vercel',
          dataApiEnabled: true,
          dataApiDefaultPrivilegesGranted: dataApiDefaultPrivileges,
          ...(dataApiRevokeOnCreateDefaultFlag !== undefined && {
            dataApiRevokeOnCreateDefaultEnabled: dataApiRevokeOnCreateDefaultFlag,
          }),
        },
        {
          project: res.ref,
          organization: res.organization_slug,
        }
      )
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
      const migrationSql = await getInitialMigrationSQLFromGitHubRepo(externalId)
      if (migrationSql) dbSql = migrationSql
      toast.success(`Done fetching initial migrations`, { id })
    }

    createProject({
      organizationSlug: organization.slug,
      name: projectName,
      dbPass,
      dbRegion,
      dbSql,
      dataApiRevokeDefaultPrivileges: !dataApiDefaultPrivileges,
    })
  }

  // Wait for the new project to be created before creating the connection
  const { data, isSuccess } = useProjectSettingsV2Query(
    { projectRef: newProjectRef },
    {
      enabled: newProjectRef !== undefined,
      // refetch until the project is created
      refetchInterval: (query) => {
        const data = query.state.data
        return ((data?.service_api_keys ?? []).length ?? 0) > 0 ? false : 1000
      },
    }
  )
  useEffect(() => {
    if (!isSuccess) return
    const onSuccessFunc = async () => {
      const isReady = (data.service_api_keys ?? []).length > 0

      if (!isReady || !organizationIntegration || !foreignProjectId || !newProjectRef) {
        return
      }

      const projectDetails = vercelProjects?.find((x: any) => x.id === foreignProjectId)

      try {
        await createConnections({
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
    }
    onSuccessFunc()
  }, [data, isSuccess])

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
          label="Database password"
          type="password"
          placeholder="Type in a strong password"
          value={dbPass}
          copy={dbPass.length > 0}
          onChange={onDbPassChange}
          descriptionText={
            <PasswordStrengthBar
              passwordStrengthScore={passwordStrengthScore as PasswordStrengthScore}
              password={dbPass}
              passwordStrengthMessage={passwordStrengthMessage}
              generateStrongPassword={generatePassword}
            />
          }
        />
      </div>
      <div className="py-2">
        <div className="mt-1">
          <FormItemLayout
            id="region"
            isReactForm={false}
            layout="vertical"
            label="Region"
            description="Select a region close to your users for the best performance."
            className="gap-[2px]"
            size="tiny"
          >
            <Select_Shadcn_ value={dbRegion} onValueChange={(region) => setDbRegion(region)}>
              <SelectTrigger_Shadcn_ id="region">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {Object.keys(AWS_REGIONS).map((option: string, i) => {
                  const label = Object.values(AWS_REGIONS)[i].displayName
                  return (
                    <SelectItem_Shadcn_ key={option} value={label}>
                      <div className="flex gap-2">
                        <img
                          alt="region icon"
                          className="w-5 rounded-xs"
                          src={`${BASE_PATH}/img/regions/${Object.values(AWS_REGIONS)[i].code}.svg`}
                        />
                        <span>{label}</span>
                      </div>
                    </SelectItem_Shadcn_>
                  )
                })}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </FormItemLayout>
        </div>
      </div>
      <div className="py-2 pb-4">
        <div className="items-top flex space-x-2">
          <Checkbox
            id="shouldRunMigrations"
            name="shouldRunMigrations"
            checked={shouldRunMigrations}
            onCheckedChange={(checked) => setShouldRunMigrations(!!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="enable-realtime"
              className="text-sm text-foreground-light flex items-center space-x-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Create sample tables with seed data
            </label>
            <p className="text-sm text-foreground-muted">
              To get you started quickly, we can create new tables for you with seed (sample) data.
              You can delete these tables later.
            </p>
          </div>
        </div>
      </div>
      <div className="py-2 pb-4">
        <div className="items-top flex space-x-2">
          <Checkbox
            id="dataApiDefaultPrivileges"
            name="dataApiDefaultPrivileges"
            checked={dataApiDefaultPrivileges}
            onCheckedChange={(checked) => setDataApiDefaultPrivileges(!!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="dataApiDefaultPrivileges"
              className="text-sm text-foreground-light flex items-center space-x-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatically expose new tables
            </label>
            <p className="text-sm text-foreground-muted">
              Grants privileges to Data API roles by default, exposing new tables. We recommend
              disabling this to control access manually.
            </p>
          </div>
        </div>
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
