'use client'

import { StepHikeCompact } from '~/components/StepHikeCompact'
import {
  AGENT_PROMPT_ANCHOR,
  getMonitoringAgent,
  getMonitoringAgentHarnesses,
  type MonitoringAgentHarnessSetup,
} from '~/data/monitoring-agents.utils'
import { SOURCE_FOOTER_CLASSES, SourceFrame } from '~/features/directives/CodeSample.client'
import { CodeTabs } from '~/features/directives/CodeTabs.components'
import Image from 'next/image'
import { useState, type MouseEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from 'ui'
import { getMcpClientIconSrc } from 'ui-patterns/McpUrlBuilder'

import { AiPrompt } from './AiPrompt'
import { PromptCode } from './PromptPanel'
import { TabPanel } from './Tabs'
import { useTabsWithQueryParams } from './useTabsWithQueryParams'

type AgentSetupProps = {
  id: string
}

type HarnessProps = {
  harness: MonitoringAgentHarnessSetup
}

const DOCS_NOTCH_WIDTH = 100
const PROMPT_FLASH_DURATION = 1600

const handleInPageLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
  const target = document.getElementById(event.currentTarget.hash.slice(1))
  if (!target) return

  event.preventDefault()
  const { hash } = event.currentTarget
  if (window.location.hash !== hash) window.history.pushState(null, '', hash)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
  target.focus({ preventScroll: true })

  const brand = getComputedStyle(target).getPropertyValue('--brand-default')
  target.animate([{ outlineColor: `hsl(${brand})` }, { outlineColor: `hsl(${brand} / 0)` }], {
    duration: PROMPT_FLASH_DURATION,
    easing: 'ease-out',
  })
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (!href) return <>{children}</>
    if (href.startsWith('#')) {
      return (
        <a href={href} onClick={handleInPageLinkClick} className="text-primary hover:underline">
          {children}
        </a>
      )
    }
    const external = /^(?:[a-z][a-z0-9+\-.]*:|\/\/)/i.test(href)
    return (
      <a
        href={href}
        className="text-primary hover:underline"
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      >
        {children}
      </a>
    )
  },
  code: PromptCode,
}

function AgentSetup({ id }: AgentSetupProps) {
  const agent = getMonitoringAgent(id)
  const harnesses = getMonitoringAgentHarnesses(agent)
  const { queryTab, onTabSelected } = useTabsWithQueryParams({
    tabIds: harnesses.map((harness) => harness.key),
    queryGroup: 'agent-setup',
  })
  const [selectedHarness, setSelectedHarness] = useState<string>(harnesses[0].key)
  const activeHarness = queryTab ?? selectedHarness

  const handleHarnessChange = (key: string) => {
    setSelectedHarness(key)
    onTabSelected(key)
  }

  return (
    <StepHikeCompact title={`Set up ${agent.name}`}>
      <StepHikeCompact.Step step={1} title="Copy the prompt">
        <StepHikeCompact.Details title="Copy the prompt" />
        <StepHikeCompact.Code className="mt-0!">
          <div
            id={AGENT_PROMPT_ANCHOR}
            tabIndex={-1}
            className="rounded-lg outline-2 outline-offset-4 outline-transparent"
          >
            <AiPrompt id={agent.promptId} telemetry={{ source: 'agent_setup' }} />
          </div>
        </StepHikeCompact.Code>
      </StepHikeCompact.Step>
      <StepHikeCompact.Step step={2} title="Schedule it in your agent">
        <StepHikeCompact.Details title="Schedule it in your agent" />
        <StepHikeCompact.Code className="mt-0!">
          <CodeTabs value={activeHarness} onValueChange={handleHarnessChange}>
            {harnesses.map((harness) => (
              <TabPanel
                key={harness.key}
                id={harness.key}
                label={harness.label}
                icon={<HarnessIcon harness={harness} />}
              >
                <SourceFrame
                  notchWidth={DOCS_NOTCH_WIDTH}
                  footer={
                    <a
                      href={harness.docsUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`View ${harness.label} docs`}
                      className={cn(SOURCE_FOOTER_CLASSES, 'pl-2')}
                    >
                      <HarnessIcon harness={harness} />
                      View docs
                    </a>
                  }
                >
                  <HarnessBody harness={harness} />
                </SourceFrame>
              </TabPanel>
            ))}
          </CodeTabs>
        </StepHikeCompact.Code>
      </StepHikeCompact.Step>
    </StepHikeCompact>
  )
}

function HarnessIcon({ harness }: HarnessProps) {
  const getSrc = (useDarkVariant: boolean) =>
    getMcpClientIconSrc({
      icon: harness.icon,
      useDarkVariant,
      hasDistinctDarkIcon: harness.hasDistinctDarkIcon,
    })

  if (!harness.hasDistinctDarkIcon) {
    return <Image src={getSrc(false)} alt="" width={14} height={14} className="size-3.5 shrink-0" />
  }

  return (
    <>
      <Image
        src={getSrc(false)}
        alt=""
        width={14}
        height={14}
        className="size-3.5 shrink-0 dark:hidden"
      />
      <Image
        src={getSrc(true)}
        alt=""
        width={14}
        height={14}
        className="hidden size-3.5 shrink-0 dark:block"
      />
    </>
  )
}

function HarnessBody({ harness }: HarnessProps) {
  return (
    <div className="code-sample-surface rounded-lg border border-default bg-200 px-5 pt-4 pb-10 text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
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
    </div>
  )
}

export { AgentSetup }
export type { AgentSetupProps }
