import { Copy } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useRef } from 'react'

import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { pluckObjectFields } from 'lib/helpers'
import { Badge, Button, copyToClipboard } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { FRAMEWORKS, MOBILES } from './Connect.constants'
import type { ConnectState, ContentFileProps, ProjectKeys, ResolvedStep } from './Connect.types'
import { ConnectSheetStep } from './ConnectSheetStep'
import { getConnectionStrings } from './DatabaseSettings.utils'

// Import step components
import { ClaudeAddServerStep, ClaudeAuthenticateStep } from './steps/ClaudeSteps'
import {
  CodexAddServerStep,
  CodexAuthenticateStep,
  CodexEnableRemoteStep,
  CodexVerifyStep,
} from './steps/CodexSteps'
import { DirectConnectionInstallStep, DirectConnectionStep } from './steps/DirectConnectionStep'
import { InstallStep } from './steps/InstallStep'
import { McpConfigStep } from './steps/McpConfigStep'
import { OrmContentStep, OrmInstallStep } from './steps/OrmSteps'
import { ShadcnCommandStep, ShadcnUiStep } from './steps/ShadcnSteps'

interface ConnectStepsSectionProps {
  steps: ResolvedStep[]
  state: ConnectState
  projectKeys: ProjectKeys
}

/**
 * Maps step content identifiers to their components.
 * Built-in components are imported directly, content files use dynamic imports.
 */
const STEP_COMPONENTS: Record<
  string,
  React.ComponentType<{ state: ConnectState; projectKeys: ProjectKeys }>
> = {
  InstallStep,
  DirectConnectionStep,
  McpConfigStep,
  OrmInstallStep,
  OrmContentStep,
  CodexAddServerStep,
  CodexEnableRemoteStep,
  CodexAuthenticateStep,
  CodexVerifyStep,
  ClaudeAddServerStep,
  ClaudeAuthenticateStep,
  ShadcnCommandStep,
  ShadcnUiStep,
  DirectConnectionInstallStep,
}

/**
 * Dynamically loads a content file from the content directory.
 */
function DynamicContentLoader({
  filePath,
  projectKeys,
}: {
  filePath: string
  projectKeys: ProjectKeys
}) {
  const { ref: projectRef } = useParams()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const allowPgBouncerSelection = useMemo(
    () => selectedOrg?.plan.id !== 'free',
    [selectedOrg]
  )

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: pgbouncerConfig } = usePgbouncerConfigQuery({ projectRef })
  const { data: supavisorConfig } = useSupavisorConfigurationQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { ipv4: ipv4Addon } = getAddons(addons?.selected_addons ?? [])

  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(settings || emptyState, DB_FIELDS)
  const poolingConfigurationShared = supavisorConfig?.find(
    (x) => x.database_type === 'PRIMARY'
  )
  const poolingConfigurationDedicated = allowPgBouncerSelection
    ? pgbouncerConfig
    : undefined

  const connectionStringsShared = getConnectionStrings({
    connectionInfo,
    poolingInfo: {
      connectionString: poolingConfigurationShared?.connection_string ?? '',
      db_host: poolingConfigurationShared?.db_host ?? '',
      db_name: poolingConfigurationShared?.db_name ?? '',
      db_port: poolingConfigurationShared?.db_port ?? 0,
      db_user: poolingConfigurationShared?.db_user ?? '',
    },
    metadata: { projectRef },
  })

  const connectionStringsDedicated =
    poolingConfigurationDedicated !== undefined
      ? getConnectionStrings({
          connectionInfo,
          poolingInfo: {
            connectionString: poolingConfigurationDedicated.connection_string,
            db_host: poolingConfigurationDedicated.db_host,
            db_name: poolingConfigurationDedicated.db_name,
            db_port: poolingConfigurationDedicated.db_port,
            db_user: poolingConfigurationDedicated.db_user,
          },
          metadata: { projectRef },
        })
      : undefined

  const connectionStringPooler = {
    transactionShared: connectionStringsShared.pooler.uri,
    sessionShared: connectionStringsShared.pooler.uri.replace('6543', '5432'),
    transactionDedicated: connectionStringsDedicated?.pooler.uri,
    sessionDedicated: connectionStringsDedicated?.pooler.uri.replace('6543', '5432'),
    ipv4SupportedForDedicatedPooler: !!ipv4Addon,
    direct: connectionStringsShared.direct.uri,
  }

  const ContentFile = useMemo(() => {
    return dynamic<ContentFileProps>(() => import(`./content/${filePath}/content`), {
      loading: () => (
        <div className="p-4 min-h-[200px]">
          <GenericSkeletonLoader />
        </div>
      ),
    })
  }, [filePath])

  // Determine connection tab based on file path
  const connectionTab = useMemo((): 'App Frameworks' | 'Mobile Frameworks' | 'ORMs' => {
    const frameworkKey = filePath.split('/')[0]
    if (MOBILES.some((m) => m.key === frameworkKey)) return 'Mobile Frameworks'
    if (FRAMEWORKS.some((f) => f.key === frameworkKey)) return 'App Frameworks'
    return 'ORMs'
  }, [filePath])

  const contentFileProjectKeys = {
    apiUrl: projectKeys.apiUrl ?? '',
    anonKey: projectKeys.anonKey ?? undefined,
    publishableKey: projectKeys.publishableKey ?? undefined,
  }

  return (
    <div className="border rounded-lg">
      <ContentFile
        projectKeys={contentFileProjectKeys}
        connectionStringPooler={connectionStringPooler}
        connectionTab={connectionTab}
      />
    </div>
  )
}

/**
 * Renders the appropriate component for a step's content.
 */
function StepContent({
  contentId,
  state,
  projectKeys,
}: {
  contentId: string
  state: ConnectState
  projectKeys: ProjectKeys
}) {
  // Check if it's a built-in component
  const BuiltInComponent = STEP_COMPONENTS[contentId]
  if (BuiltInComponent) {
    return <BuiltInComponent state={state} projectKeys={projectKeys} />
  }

  // Special case for framework content - derive path from state
  if (contentId === 'FrameworkContentStep') {
    const filePath = getFrameworkContentPath(state)
    if (filePath) {
      return <DynamicContentLoader filePath={filePath} projectKeys={projectKeys} />
    }
    return null
  }

  // Otherwise, treat as content file path (existing dynamic import pattern)
  return <DynamicContentLoader filePath={contentId} projectKeys={projectKeys} />
}

/**
 * Derives the content file path from state for framework mode.
 */
function getFrameworkContentPath(state: ConnectState): string | null {
  const { framework, frameworkVariant, library } = state

  if (!framework) return null

  // Build path based on available state
  const parts = [framework]

  if (frameworkVariant) {
    parts.push(String(frameworkVariant))
  }

  if (library) {
    parts.push(String(library))
  } else {
    // Default to supabasejs if no library specified
    parts.push('supabasejs')
  }

  return parts.join('/')
}

export function ConnectStepsSection({
  steps,
  state,
  projectKeys,
}: ConnectStepsSectionProps) {
  const stepsContainerRef = useRef<HTMLDivElement | null>(null)

  const normalizeTextLines = (value: string) => {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
  }

  const getStepTextContent = (contentElement: HTMLElement) => {
    const clone = contentElement.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll('pre, button, svg, input, textarea, select, [aria-hidden="true"]')
      .forEach((element) => element.remove())

    const text = clone.textContent ?? ''
    return normalizeTextLines(text)
  }

  const getStepCodeSnippets = (contentElement: HTMLElement) => {
    const snippets: Array<{ label: string; snippet: string }> = []
    const seen = new Set<string>()

    const addSnippet = (label: string, snippet: string) => {
      if (!snippet || seen.has(snippet)) return
      seen.add(snippet)
      snippets.push({ label, snippet })
    }

    const tabContents = Array.from(
      contentElement.querySelectorAll('[data-connect-tab-content]')
    ) as HTMLElement[]

    tabContents.forEach((tabContent) => {
      const label = tabContent.getAttribute('data-tab-label') || 'Code'
      const tabSnippets = Array.from(tabContent.querySelectorAll('pre'))
        .map((pre) => pre.textContent?.trim())
        .filter((snippet): snippet is string => Boolean(snippet))

      if (tabSnippets.length === 0) {
        const inlineSnippets = Array.from(tabContent.querySelectorAll('code'))
          .filter((code) => !code.closest('pre') && code.closest('.font-mono'))
          .map((code) => code.textContent?.trim())
          .filter((snippet): snippet is string => Boolean(snippet))
        inlineSnippets.forEach((snippet, index) => {
          const inlineLabel = inlineSnippets.length > 1 ? `${label} (part ${index + 1})` : label
          addSnippet(inlineLabel, snippet)
        })
        return
      }

      tabSnippets.forEach((snippet, index) => {
        const tabLabel = tabSnippets.length > 1 ? `${label} (part ${index + 1})` : label
        addSnippet(tabLabel, snippet)
      })
    })

    contentElement.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('[data-connect-tab-content]')) return
      const snippet = pre.textContent?.trim()
      if (snippet) addSnippet('Code', snippet)
    })

    contentElement.querySelectorAll('code').forEach((code) => {
      if (code.closest('pre')) return
      if (code.closest('[data-connect-tab-content]')) return
      if (!code.closest('.font-mono')) return
      const snippet = code.textContent?.trim()
      if (snippet) addSnippet('Code', snippet)
    })

    return snippets
  }

  const handleCopyPrompt = () => {
    const stepElements = stepsContainerRef.current?.querySelectorAll('[data-connect-step]')
    if (!stepElements?.length) return

    const promptContent = Array.from(stepElements)
      .map((stepElement, index) => {
        const title = stepElement.getAttribute('data-step-title') ?? `Step ${index + 1}`
        const description = stepElement.getAttribute('data-step-description') ?? ''
        const contentElement = stepElement.querySelector(
          '[data-step-content]'
        ) as HTMLElement | null

        const details = contentElement ? getStepTextContent(contentElement) : ''
        const codeSnippets = contentElement ? getStepCodeSnippets(contentElement) : []

        const sections = [
          `${index + 1}. ${title}`,
          description,
          details ? `Details:\n${details}` : null,
          codeSnippets.length
            ? `Code:\n${codeSnippets
                .map(
                  ({ label, snippet }) =>
                    `File: ${label}\n\`\`\`\n${snippet}\n\`\`\``
                )
                .join('\n\n')}`
            : null,
        ].filter(Boolean)

        return sections.join('\n')
      })
      .join('\n\n')

    copyToClipboard(promptContent)
  }

  if (steps.length === 0) return null

  return (
    <div className="bg-muted/50 flex-1">
      <div className="p-8">
        <h3 className="heading-subTitle mb-6">Connect your app</h3>

        <Admonition
          type="tip"
          showIcon={false}
          layout="horizontal"
          className="mb-6"
          actions={
            <Button
              type="default"
              size="small"
              icon={<Copy size={14} />}
              onClick={handleCopyPrompt}
            >
              Copy prompt
            </Button>
          }
        >
          {/* Background image */}
          <div className="absolute -inset-16 z-0 opacity-50">
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
              alt="Supabase Grafana"
              className="w-full h-full object-cover object-right hidden dark:block"
            />
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
              alt="Supabase Grafana"
              className="w-full h-full object-cover object-right dark:hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2">
            <div className="flex flex-col gap-y-0.5">
              <div className="flex flex-col gap-y-2 items-start">
                <Badge variant="success" className="-ml-0.5">
                  Skip the steps
                </Badge>
                <p className="heading-default">Prompt your agent</p>
              </div>
              <p className="text-sm text-foreground-lighter text-balance">
                Copy a prompt with everything your agent needs to connect your app for you.
              </p>
            </div>
          </div>
        </Admonition>

        <div className="space-y-0" ref={stepsContainerRef}>
          {steps.map((step, index) => (
            <ConnectSheetStep
              key={step.id}
              number={index + 1}
              title={step.title}
              description={step.description}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
            >
              <StepContent
                contentId={step.content}
                state={state}
                projectKeys={projectKeys}
              />
            </ConnectSheetStep>
          ))}
        </div>
      </div>
    </div>
  )
}
