import { useParams } from 'common'
import { keyBy } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useMemo, type ReactNode } from 'react'
import InlineSVG from 'react-inlinesvg'
import { toast } from 'sonner'
import { Button, cn } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import { ENV_VAR_RAW_KEYS } from '@/components/interfaces/Integrations/Vercel/Integrations-Vercel.constants'
import { isVercelUrl } from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import ProjectLinker, {
  ForeignProject,
} from '@/components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { Markdown } from '@/components/interfaces/Markdown'
import {
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { vercelIcon } from '@/components/to-be-cleaned/ListIcons'
import { useOrgIntegrationsQuery } from '@/data/integrations/integrations-query-org-only'
import { useIntegrationVercelConnectionsCreateMutation } from '@/data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from '@/data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import { EMPTY_ARR } from '@/lib/void'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout, Organization } from '@/types'

const VERCEL_ICON = (
  <img src={`${BASE_PATH}/img/icons/vercel-icon.svg`} alt="Vercel Icon" className="w-4" />
)

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
  const vercelProjectsById = useMemo(() => keyBy(vercelProjects, 'id'), [vercelProjects])

  const getForeignProjectIcon = useCallback(
    (_project: ForeignProject) => {
      const project = vercelProjectsById[_project.id]

      return !project?.framework ? (
        vercelIcon
      ) : (
        <img
          src={`${BASE_PATH}/img/icons/frameworks/${project.framework}.svg`}
          width={21}
          height={21}
          alt={`icon`}
        />
      )
    },
    [vercelProjectsById]
  )

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
    (vars: any) => {
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
    return <VercelProjectConnectionMockScreen mock={mock} onSelectMockState={replaceMockState} />
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
        containerClassName="items-start"
        cardClassName="max-w-[900px]"
      >
        <div className="flex flex-col gap-5 px-6 pb-6">
          <ProjectLinker
            slug={organization?.slug}
            organizationIntegrationId={integration?.id}
            foreignProjects={vercelProjects}
            onCreateConnections={onCreateConnections}
            installedConnections={integration?.connections}
            isLoading={isCreatingConnection}
            integrationIcon={VERCEL_ICON}
            getForeignProjectIcon={getForeignProjectIcon}
            choosePrompt="Choose Vercel Project"
            onSkip={() => {
              if (next && isVercelUrl(next)) {
                window.location.href = next
              }
            }}
            loadingForeignProjects={isLoadingVercelProjectsData}
            mode="Vercel"
            variant="embedded"
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

const VercelProjectConnectionMockScreen = ({
  mock,
  onSelectMockState,
}: {
  mock: VercelProjectConnectionMockState
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
      containerClassName="items-start"
      cardClassName="max-w-[900px]"
    >
      <div className="flex flex-col gap-5 px-6 pb-6">
        <MockProjectLinker state={mock} />
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

const MockProjectLinker = ({ state }: { state: VercelProjectConnectionMockState }) => {
  const isLoading = state === 'loading'
  const isEmpty = state === 'no-projects'
  const isConnected = state === 'connected'

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-muted">
      <div className="relative border-b border-muted p-8">
        <div
          className="absolute inset-0 bg-grid-black/5 mask-[linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:mask-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          style={{ backgroundPosition: '10px 10px' }}
        />
        {isLoading ? (
          <div className="relative mx-auto w-1/2 space-y-2 py-4">
            <p className="text-center text-sm text-foreground">Loading projects</p>
            <ShimmeringLoader className="py-2" />
          </div>
        ) : isEmpty ? (
          <div className="relative text-center">
            <h5 className="text-foreground">No Vercel Projects found</h5>
            <p className="text-sm text-foreground-light">
              You can skip this and create a project connection later.
            </p>
          </div>
        ) : (
          <div className="relative flex w-full justify-center gap-0">
            <MockProjectPanel logo={<SupabaseLogo />} label="api-service" selected={isConnected} />
            <div className="mb-4 h-px w-8 self-end border border-dashed border-foreground-lighter" />
            <MockProjectPanel logo={<VercelLogo />} label="web-dashboard" selected={isConnected} />
          </div>
        )}
      </div>

      <div className="flex w-full justify-end gap-2 bg-surface-75 p-4">
        <Button size="medium" type="default" disabled={isLoading || isConnected}>
          Skip
        </Button>
        <Button size="medium" disabled={isLoading || isEmpty || isConnected}>
          {isConnected ? 'Connected' : 'Connect project'}
        </Button>
      </div>
    </div>
  )
}

const MockProjectPanel = ({
  logo,
  label,
  selected,
}: {
  logo: ReactNode
  label: string
  selected?: boolean
}) => (
  <div className="mx-auto flex min-w-0 flex-1 grow flex-col items-center justify-center gap-6 px-5">
    {logo}
    <Button
      type="default"
      block
      className={cn('h-[34px] justify-start', selected && 'border-brand bg-brand-200')}
    >
      {label}
    </Button>
  </div>
)
