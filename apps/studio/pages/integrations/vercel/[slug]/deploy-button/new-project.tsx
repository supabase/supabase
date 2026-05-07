import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useState } from 'react'
import InlineSVG from 'react-inlinesvg'
import { AWS_REGIONS } from 'shared-data'
import { toast } from 'sonner'
import {
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

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import { isVercelUrl } from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
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
import { withAuth } from '@/hooks/misc/withAuth'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { BASE_PATH, PROVIDERS } from '@/lib/constants'
import { getInitialMigrationSQLFromGitHubRepo } from '@/lib/integration-utils'
import { buildStudioPageTitle } from '@/lib/page-title'
import { passwordStrength, PasswordStrengthScore } from '@/lib/password-strength'
import { useProfile } from '@/lib/profile'
import { generateStrongPassword } from '@/lib/project'
import { useTrack } from '@/lib/telemetry/track'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Create Supabase Project', brand: 'Supabase' })
const VERCEL_PROJECT_CREATION_MOCK_STATES = ['ready', 'creating'] as const
type VercelProjectCreationMockState = (typeof VERCEL_PROJECT_CREATION_MOCK_STATES)[number]

const VercelLogo = () => (
  <LogoBox className="border-black bg-black text-white">
    <InlineSVG
      src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
      title="Vercel"
      className="size-6 text-white"
    />
  </LogoBox>
)

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()
  const { profile } = useProfile()
  const displayName = profile?.primary_email ?? profile?.username
  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, VERCEL_PROJECT_CREATION_MOCK_STATES)
      : undefined

  const replaceMockState = (state: VercelProjectCreationMockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  if (mock) {
    return (
      <VercelProjectCreationMockScreen
        mock={mock}
        displayName={displayName}
        onSelectMockState={replaceMockState}
      />
    )
  }

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <InterstitialLayout
        logo={<LogoPair left={<VercelLogo />} right={<SupabaseLogo />} />}
        title="Create Supabase project"
        description="Create a project to connect with your Vercel deployment"
        containerClassName="items-start"
        cardClassName="max-w-[480px]"
      >
        <div className="flex flex-col gap-5 px-6 pb-6">
          <InterstitialAccountRow displayName={displayName} />
          <CreateProject />
          <div className="text-center text-xs text-foreground-muted text-balance">
            <p>You can remove this integration at any time from Vercel or Supabase.</p>
          </div>
        </div>
      </InterstitialLayout>
    </>
  )
}

const VercelProjectCreationMockScreen = ({
  mock,
  displayName,
  onSelectMockState,
}: {
  mock: VercelProjectCreationMockState
  displayName?: string
  onSelectMockState: (state: VercelProjectCreationMockState) => void
}) => (
  <>
    <Head>
      <title>{PAGE_TITLE}</title>
    </Head>
    <ConnectPreviewToolbar>
      <ConnectMockMenu
        state={mock}
        states={VERCEL_PROJECT_CREATION_MOCK_STATES}
        onSelect={onSelectMockState}
      />
    </ConnectPreviewToolbar>
    <InterstitialLayout
      logo={<LogoPair left={<VercelLogo />} right={<SupabaseLogo />} />}
      title="Create Supabase project"
      description="Create a project to connect with your Vercel deployment"
      containerClassName="items-start"
      cardClassName="max-w-[480px]"
    >
      <div className="flex flex-col gap-5 px-6 pb-6">
        <InterstitialAccountRow displayName={displayName ?? 'test@example.com'} />
        <MockCreateProject isCreating={mock === 'creating'} />
        <div className="text-center text-xs text-foreground-muted text-balance">
          <p>You can remove this integration at any time from Vercel or Supabase.</p>
        </div>
      </div>
    </InterstitialLayout>
  </>
)

const MockCreateProject = ({ isCreating }: { isCreating: boolean }) => (
  <div>
    <p className="mb-2">Supabase project details</p>
    <div className="py-2">
      <Input
        id="mockProjectName"
        label="Project name"
        type="text"
        value="web-dashboard"
        onChange={() => undefined}
        disabled={isCreating}
      />
    </div>
    <div className="py-2">
      <Input
        id="mockDbPass"
        label="Database password"
        type="password"
        value="mock-password"
        onChange={() => undefined}
        disabled={isCreating}
        copy={!isCreating}
      />
    </div>
    <div className="py-2">
      <div className="mt-1">
        <FormItemLayout
          id="mockRegion"
          isReactForm={false}
          layout="vertical"
          label="Region"
          description="Select a region close to your users for the best performance."
          className="gap-[2px]"
          size="tiny"
        >
          <Select_Shadcn_ value="US East (N. Virginia)" onValueChange={() => undefined}>
            <SelectTrigger_Shadcn_ id="mockRegion" disabled={isCreating}>
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="US East (N. Virginia)">
                <div className="flex gap-2">
                  <img
                    alt="region icon"
                    className="w-5 rounded-xs"
                    src={`${BASE_PATH}/img/regions/us-east-1.svg`}
                  />
                  <span>US East (N. Virginia)</span>
                </div>
              </SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormItemLayout>
      </div>
    </div>
    <div className="py-2 pb-4">
      <div className="items-top flex space-x-2">
        <Checkbox id="mockShouldRunMigrations" checked disabled={isCreating} />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="mockShouldRunMigrations"
            className="text-sm text-foreground-light flex items-center space-x-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Create sample tables with seed data
          </label>
          <p className="text-sm text-foreground-muted">
            To get you started quickly, we can create new tables for you with seed data.
          </p>
        </div>
      </div>
    </div>
    <div className="py-2 pb-4">
      <div className="items-top flex space-x-2">
        <Checkbox id="mockDataApiDefaultPrivileges" checked disabled={isCreating} />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="mockDataApiDefaultPrivileges"
            className="text-sm text-foreground-light flex items-center space-x-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Automatically expose new tables
          </label>
          <p className="text-sm text-foreground-muted">
            Grants privileges to Data API roles by default. We recommend disabling this to control
            access manually.
          </p>
        </div>
      </div>
    </div>
    <div className="flex w-full flex-row justify-end">
      <Button size="medium" className="self-end" loading={isCreating} disabled={isCreating}>
        Create Project
      </Button>
    </div>
  </div>
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

export default withAuth(VercelIntegration)
