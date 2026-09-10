'use client'

import {
  getMonitoringAgent,
  getMonitoringAgentHarnesses,
  type MonitoringAgentHarnessSetup,
} from '~/data/monitoring-agents.utils'
import { Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { ConnectionIcon } from 'ui-patterns/McpUrlBuilder'

import { AiPrompt } from './AiPrompt'
import { TabPanel, Tabs } from './Tabs'

type AgentSetupProps = {
  id: string
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (!href) return <>{children}</>
    const external = /^(?:[a-z][a-z0-9+\-.]*:|\/\/)/i.test(href)
    return (
      <a
        href={href}
        className="text-brand-link hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {children}
      </a>
    )
  },
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-surface-200 px-1 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  ),
}

function HarnessBody({ harness }: { harness: MonitoringAgentHarnessSetup }) {
  return (
    <>
      <p>{harness.intro}</p>
      <ol>
        {harness.steps.map((step) => (
          <li key={step}>
            <ReactMarkdown components={markdownComponents}>{step}</ReactMarkdown>
          </li>
        ))}
      </ol>
      {harness.note && (
        <p>
          <ReactMarkdown components={markdownComponents}>{harness.note}</ReactMarkdown>
        </p>
      )}
      <p>
        <a
          href={harness.docsUrl}
          className="text-brand-link hover:underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          {harness.label} docs
        </a>
      </p>
    </>
  )
}

function AgentSetup({ id }: AgentSetupProps) {
  const agent = getMonitoringAgent(id)
  const harnesses = getMonitoringAgentHarnesses(agent)
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme?.includes('dark') ? 'dark' : 'light'

  return (
    <Tabs
      defaultActiveId="prompt"
      type="underlined"
      size="small"
      wrappable
      queryGroup="agent-setup"
    >
      <TabPanel id="prompt" label="Prompt" icon={<Sparkles size={14} />}>
        <AiPrompt id={agent.promptId} />
      </TabPanel>
      {harnesses.map((harness) => (
        <TabPanel
          key={harness.key}
          id={harness.key}
          label={harness.label}
          icon={
            <ConnectionIcon
              theme={theme}
              connection={harness.icon}
              hasDistinctDarkIcon={harness.hasDistinctDarkIcon}
            />
          }
        >
          <HarnessBody harness={harness} />
        </TabPanel>
      ))}
    </Tabs>
  )
}

export { AgentSetup }
export type { AgentSetupProps }
