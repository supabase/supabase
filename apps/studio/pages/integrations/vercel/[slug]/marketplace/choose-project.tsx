import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import InlineSVG from 'react-inlinesvg'
import { toast } from 'sonner'
import {
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import { ENV_VAR_RAW_KEYS } from '@/components/interfaces/Integrations/Vercel/Integrations-Vercel.constants'
import { isVercelUrl } from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import type { ForeignProject } from '@/components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { Markdown } from '@/components/interfaces/Markdown'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useOrgIntegrationsQuery } from '@/data/integrations/integrations-query-org-only'
import { useIntegrationVercelConnectionsCreateMutation } from '@/data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from '@/data/integrations/integrations-vercel-projects-query'
import type {
  IntegrationConnectionsCreateVariables,
  IntegrationProjectConnection,
} from '@/data/integrations/integrations.types'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfile } from '@/lib/profile'
import { EMPTY_ARR } from '@/lib/void'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout, Organization } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Connect Vercel Project', brand: 'Supabase' })
const VERCEL_PROJECT_CONNECTION_MOCK_STATES = [
  'loading',
  'ready',
  'connected',
  'no-projects',
] as const
type VercelProjectConnectionMockState = (typeof VERCEL_PROJECT_CONNECTION_MOCK_STATES)[number]

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
  const { slug, configurationId, next } = useParams()
  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, VERCEL_PROJECT_CONNECTION_MOCK_STATES)
      : undefined
  const isMockMode = !!mock

  const replaceMockState = (state: VercelProjectConnectionMockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData } = useOrgIntegrationsQuery(
    { orgSlug: slug },
    { enabled: !isMockMode }
  )

  const { data } = useOrganizationsQuery({ enabled: !isMockMode && slug !== undefined })

  const organization = data?.find((organization: Organization) => organization.slug === slug)

  const integration = integrationData?.find(
    (x) =>
      x.metadata !== undefined &&
      'configuration_id' in x.metadata &&
      x.metadata?.configuration_id === configurationId
  )

  const { data: vercelProjectsData, isPending: isLoadingVercelProjectsData } =
    useVercelProjectsQuery(
      {
        organization_integration_id: integration?.id,
      },
      { enabled: !isMockMode && integration?.id !== undefined }
    )

  const vercelProjects = useMemo(() => vercelProjectsData ?? EMPTY_ARR, [vercelProjectsData])

  const snapshot = useIntegrationInstallationSnapshot()

  const { mutate: createConnections, isPending: isCreatingConnection } =
    useIntegrationVercelConnectionsCreateMutation({
      onSuccess() {
        if (next && isVercelUrl(next)) {
          snapshot.setLoading(false)
          window.location.href = next
        }
      },
      onMutate() {
        snapshot.setLoading(true)
      },
      onError(error) {
        snapshot.setLoading(false)
        toast.error(`Creating connection failed: ${error.message}`)
      },
    })

  const onCreateConnections = useCallback(
    (vars: IntegrationConnectionsCreateVariables) => {
      createConnections({
        ...vars,
        connection: {
          ...vars.connection,
          metadata: {
            ...vars.connection.metadata,
            supabaseConfig: {
              projectEnvVars: {
                write: true,
              },
            },
          },
        },
      })
    },
    [createConnections]
  )

  if (mock) {
    return (
      <VercelProjectConnectionMockScreen
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
        title="Connect Vercel project"
        description="Choose the Supabase project that should receive Vercel environment variables"
      >
        <div className="flex flex-col gap-5 px-6 pb-6">
          <InterstitialAccountRow displayName={displayName} />
          <VercelProjectConnectionForm
            slug={organization?.slug}
            organizationIntegrationId={integration?.id}
            foreignProjects={vercelProjects}
            onCreateConnections={onCreateConnections}
            installedConnections={integration?.connections}
            isLoading={isCreatingConnection}
            onSkip={() => {
              if (next && isVercelUrl(next)) {
                window.location.href = next
              }
            }}
            loadingForeignProjects={isLoadingVercelProjectsData}
          />
          <div className="rounded-md border border-muted bg-surface-75 px-4 py-3">
            <Markdown
              className="text-xs text-foreground-muted"
              content={`The following environment variables will be added:${ENV_VAR_RAW_KEYS.map((x) => `\n- \`${x}\``).join('')}`}
            />
          </div>
        </div>
      </InterstitialLayout>
    </>
  )
}

export default withAuth(VercelIntegration)

const VercelProjectConnectionForm = ({
  slug,
  organizationIntegrationId,
  foreignProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = EMPTY_ARR,
  isLoading,
  onSkip,
  loadingForeignProjects,
}: {
  slug?: string
  organizationIntegrationId?: string
  foreignProjects: ForeignProject[]
  onCreateConnections: (variables: IntegrationConnectionsCreateVariables) => void
  installedConnections?: IntegrationProjectConnection[]
  isLoading?: boolean
  onSkip?: () => void
  loadingForeignProjects?: boolean
}) => {
  const [supabaseProjectRef, setSupabaseProjectRef] = useState<string>()
  const [vercelProjectId, setVercelProjectId] = useState<string>()

  const { data: orgProjects, isPending: isLoadingSupabaseProjects } = useOrgProjectsInfiniteQuery(
    { slug },
    { enabled: !!slug }
  )
  const supabaseProjects = useMemo(
    () => orgProjects?.pages.flatMap((page) => page.projects) ?? EMPTY_ARR,
    [orgProjects?.pages]
  )
  const selectedSupabaseProject = supabaseProjectRef
    ? supabaseProjects.find((project) => project.ref === supabaseProjectRef)
    : undefined
  const selectedVercelProject = vercelProjectId
    ? foreignProjects.find((project) => project.id?.toLowerCase() === vercelProjectId.toLowerCase())
    : undefined
  const connectedVercelProjectIds = new Set(
    installedConnections.map((connection) => connection.foreign_project_id)
  )
  const hasSupabaseProjects = supabaseProjects.length > 0
  const hasVercelProjects = foreignProjects.length > 0
  const isSelectedVercelProjectConnected = selectedVercelProject
    ? connectedVercelProjectIds.has(selectedVercelProject.id)
    : false
  const isReadyToConnect =
    !!organizationIntegrationId &&
    !!selectedSupabaseProject?.ref &&
    !!selectedVercelProject?.id &&
    !isSelectedVercelProjectConnected

  function createConnection() {
    if (!selectedVercelProject?.id) return console.error('No Vercel project ID set')
    if (!selectedSupabaseProject?.ref) return console.error('No Supabase project ref set')

    if (connectedVercelProjectIds.has(selectedVercelProject.id)) {
      return toast.error(
        `Unable to connect to ${selectedVercelProject.name}: selected project already has an installed connection`
      )
    }

    _onCreateConnections({
      organizationIntegrationId: organizationIntegrationId!,
      connection: {
        foreign_project_id: selectedVercelProject.id,
        supabase_project_ref: selectedSupabaseProject.ref,
        integration_id: '0',
        metadata: {
          ...selectedVercelProject,
        },
      },
      orgSlug: slug,
      new: {
        installation_id: selectedVercelProject.installation_id!,
        project_ref: selectedSupabaseProject.ref,
        repository_id: Number(selectedVercelProject.id),
      },
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <ProjectSelectionSection
        label="Supabase project"
        description="Project that receives the Vercel environment variables"
      >
        <Select_Shadcn_
          value={supabaseProjectRef ?? ''}
          disabled={isLoadingSupabaseProjects || isLoading}
          onValueChange={setSupabaseProjectRef}
        >
          <SelectTrigger_Shadcn_ size="small" aria-label="Supabase project to connect">
            <SelectValue_Shadcn_
              placeholder={isLoadingSupabaseProjects ? 'Loading projects' : 'Select a project'}
            />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {supabaseProjects.map((project) => (
              <SelectItem_Shadcn_ key={project.ref} value={project.ref} className="text-xs">
                {project.name}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </ProjectSelectionSection>

      <ProjectSelectionSection
        label="Vercel project"
        description="Project that will receive the Supabase variables"
      >
        <Select_Shadcn_
          value={vercelProjectId ?? ''}
          disabled={loadingForeignProjects || isLoading}
          onValueChange={setVercelProjectId}
        >
          <SelectTrigger_Shadcn_ size="small" aria-label="Vercel project to connect">
            <SelectValue_Shadcn_
              placeholder={loadingForeignProjects ? 'Loading projects' : 'Select a project'}
            />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {foreignProjects.map((project) => {
              const isConnected = connectedVercelProjectIds.has(project.id)

              return (
                <SelectItem_Shadcn_ key={project.id} value={project.id} className="text-xs">
                  {project.name}
                  {isConnected ? ' (already connected)' : ''}
                </SelectItem_Shadcn_>
              )
            })}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </ProjectSelectionSection>

      {!hasSupabaseProjects && (
        <Admonition
          type="warning"
          description="Create a Supabase project before connecting this Vercel project."
        />
      )}

      {!loadingForeignProjects && !hasVercelProjects && (
        <Admonition
          type="warning"
          description="No Vercel projects were found for this integration."
        />
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="primary"
          block
          loading={isLoading}
          disabled={
            !isReadyToConnect || isLoadingSupabaseProjects || loadingForeignProjects || isLoading
          }
          onClick={createConnection}
        >
          Connect project
        </Button>
        {onSkip && (
          <Button type="text" block disabled={isLoading} onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  )
}

const ProjectSelectionSection = ({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) => (
  <section className="space-y-2">
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">{label}</p>
      <p className="pr-4 text-xs text-foreground-lighter">{description}</p>
    </div>
    {children}
  </section>
)

const VercelProjectConnectionMockScreen = ({
  mock,
  displayName,
  onSelectMockState,
}: {
  mock: VercelProjectConnectionMockState
  displayName?: string
  onSelectMockState: (state: VercelProjectConnectionMockState) => void
}) => (
  <>
    <Head>
      <title>{PAGE_TITLE}</title>
    </Head>
    <ConnectPreviewToolbar>
      <ConnectMockMenu
        state={mock}
        states={VERCEL_PROJECT_CONNECTION_MOCK_STATES}
        onSelect={onSelectMockState}
      />
    </ConnectPreviewToolbar>
    <InterstitialLayout
      logo={<LogoPair left={<VercelLogo />} right={<SupabaseLogo />} />}
      title="Connect Vercel project"
      description="Choose the Supabase project that should receive Vercel environment variables"
    >
      <div className="flex flex-col gap-5 px-6 pb-6">
        <InterstitialAccountRow displayName={displayName ?? 'test@example.com'} />
        <MockProjectConnectionForm state={mock} />
        {mock === 'connected' && (
          <Admonition
            type="success"
            title="Project connected"
            description="Environment variables will sync to the selected Vercel project."
          />
        )}
        <div className="rounded-md border border-muted bg-surface-75 px-4 py-3">
          <Markdown
            className="text-xs text-foreground-muted"
            content={`The following environment variables will be added:${ENV_VAR_RAW_KEYS.map((x) => `\n- \`${x}\``).join('')}`}
          />
        </div>
      </div>
    </InterstitialLayout>
  </>
)

const MockProjectConnectionForm = ({ state }: { state: VercelProjectConnectionMockState }) => {
  const isLoading = state === 'loading'
  const isEmpty = state === 'no-projects'
  const isConnected = state === 'connected'

  return (
    <div className="flex flex-col gap-5">
      <ProjectSelectionSection
        label="Supabase project"
        description="Project that receives the Vercel environment variables"
      >
        <Select_Shadcn_ value={isLoading ? '' : 'abcd1234'} disabled={isLoading || isConnected}>
          <SelectTrigger_Shadcn_ size="small" aria-label="Supabase project to connect">
            <SelectValue_Shadcn_
              placeholder={isLoading ? 'Loading projects' : 'Select a project'}
            />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            <SelectItem_Shadcn_ value="abcd1234" className="text-xs">
              api-service
            </SelectItem_Shadcn_>
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </ProjectSelectionSection>

      <ProjectSelectionSection
        label="Vercel project"
        description="Project that will receive the Supabase variables"
      >
        <Select_Shadcn_
          value={isLoading || isEmpty ? '' : 'prj_mock_vercel_project'}
          disabled={isLoading || isEmpty || isConnected}
        >
          <SelectTrigger_Shadcn_ size="small" aria-label="Vercel project to connect">
            <SelectValue_Shadcn_
              placeholder={isLoading ? 'Loading projects' : 'Select a project'}
            />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            <SelectItem_Shadcn_ value="prj_mock_vercel_project" className="text-xs">
              web-dashboard
            </SelectItem_Shadcn_>
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </ProjectSelectionSection>

      {isEmpty && (
        <Admonition
          type="warning"
          description="No Vercel projects were found for this integration."
        />
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="primary"
          block
          loading={isLoading}
          disabled={isLoading || isEmpty || isConnected}
        >
          {isConnected ? 'Connected' : 'Connect project'}
        </Button>
        <Button type="text" block disabled={isLoading || isConnected}>
          Skip for now
        </Button>
      </div>
    </div>
  )
}
