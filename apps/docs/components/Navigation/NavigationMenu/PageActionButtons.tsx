'use client'

import { aiToolsSupportedAgents } from '~/data/content-listings/ai-tools.data'
import { AGENT_CLIENT_PARAM } from '~/features/ui/AgentPluginsPanel.data'
import { CrossfadeIcon } from '~/features/ui/CodeBlock/CodeBlock.client'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useSearchParamsShallow } from 'common'
import { ChevronDown, Copy, createLucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import {
  cn,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  copyToClipboard,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface Agent {
  title: string
  href: string
  icon: string
  hasLightIcon?: boolean
}

interface PageActionButtonsProps {
  className?: string
}

interface AgentComboboxProps {
  onAgentSelect: (agent: Agent) => void
}

interface AgentOptionProps {
  agent: Agent
  onAgentSelect: (agent: Agent) => void
}

interface AgentLogoProps {
  agent: Agent
}

const CircleCheckFilled = createLucideIcon('CircleCheckFilled', [
  ['circle', { cx: '12', cy: '12', r: '10', fill: 'currentColor', key: 'circle' }],
  ['path', { d: 'm9 12 2 2 4-4', stroke: 'var(--background-default)', key: 'check' }],
])

const ICON_BUTTON_CLASS_NAME =
  'flex size-7.5 items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'

const AGENTS = aiToolsSupportedAgents.items.reduce<Agent[]>((agents, item) => {
  if (typeof item.icon !== 'string') return agents
  agents.push({
    title: item.title,
    href: item.href,
    icon: item.icon,
    hasLightIcon: item.hasLightIcon,
  })
  return agents
}, [])

const DEFAULT_AGENT_TITLE = 'Claude Code'

const ROLL_STEPS = AGENTS.length

const ROLL_STEP_MS = 800
const ROLL_SLIDE_MS = 320

const ROLL_KEYFRAMES: Keyframe[] = [
  ...Array.from({ length: ROLL_STEPS }, (_, step) => [
    {
      offset: step / ROLL_STEPS,
      transform: `translateY(${step * -16}px)`,
      easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
    },
    {
      offset: (step + ROLL_SLIDE_MS / ROLL_STEP_MS) / ROLL_STEPS,
      transform: `translateY(${(step + 1) * -16}px)`,
    },
  ]).flat(),
  { offset: 1, transform: `translateY(${ROLL_STEPS * -16}px)` },
]
const ROLL_TIMING: KeyframeAnimationOptions = {
  duration: ROLL_STEPS * ROLL_STEP_MS,
  iterations: Infinity,
}

const getRollAgents = (restingTitle: string) => {
  const start = Math.max(
    AGENTS.findIndex((agent) => agent.title === restingTitle),
    0
  )
  return [...AGENTS.slice(start), ...AGENTS.slice(0, start), AGENTS[start]]
}

export const PageActionButtons = ({ className }: PageActionButtonsProps) => {
  const pathname = usePathname() ?? ''
  const sendTelemetryEvent = useSendTelemetryEvent()
  const [isUrlCopied, setIsUrlCopied] = useState(false)

  const isGuide = pathname.startsWith('/guides/')
  // reference pages have no markdown export, so they only get the agent setup
  if (!isGuide && !pathname.startsWith('/reference/')) return null

  const markdownUrl = `/docs${pathname}.md`

  const handleCopyUrl = () =>
    copyToClipboard(`https://supabase.com${markdownUrl}`, () => {
      sendTelemetryEvent({ action: 'docs_markdown_url_copied' })
      setIsUrlCopied(true)
      setTimeout(() => setIsUrlCopied(false), 2000)
    })

  const handleViewMarkdown = () => sendTelemetryEvent({ action: 'docs_view_as_markdown_clicked' })

  const handleAgentSetup = (agent: Agent) =>
    sendTelemetryEvent({ action: 'agent_setup_clicked', properties: { agent: agent.title } })

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      {isGuide ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                tabIndex={0}
                aria-label="Copy Markdown URL"
                aria-describedby={undefined}
                onClick={handleCopyUrl}
                className={cn(ICON_BUTTON_CLASS_NAME, 'group/btn')}
              >
                <CrossfadeIcon
                  active={isUrlCopied}
                  activeIcon={CircleCheckFilled}
                  inactiveIcon={Copy}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isUrlCopied ? 'Copied' : 'Copy Markdown URL'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={markdownUrl}
                aria-label="View as Markdown"
                aria-describedby={undefined}
                onClick={handleViewMarkdown}
                className={ICON_BUTTON_CLASS_NAME}
              >
                <MarkdownIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom">View as Markdown</TooltipContent>
          </Tooltip>
        </>
      ) : null}
      <AgentCombobox onAgentSelect={handleAgentSetup} />
      <span className="sr-only" role="status">
        {isUrlCopied ? 'Copied to clipboard' : ''}
      </span>
    </div>
  )
}

const AgentCombobox = ({ onAgentSelect }: AgentComboboxProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParamsShallow()
  const [isOpen, setIsOpen] = useState(false)
  const [restingTitle, setRestingTitle] = useState(DEFAULT_AGENT_TITLE)
  const trackRef = useRef<HTMLSpanElement>(null)
  const rollRef = useRef<Animation | null>(null)
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const rollAgents = getRollAgents(restingTitle)

  const handleRollStart = () => {
    if (isOpen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    clearTimeout(settleTimeoutRef.current)
    if (rollRef.current) {
      rollRef.current.play()
      return
    }
    rollRef.current = trackRef.current?.animate(ROLL_KEYFRAMES, ROLL_TIMING) ?? null
  }
  const handleRollEnd = () => {
    const roll = rollRef.current
    if (!roll) return
    const elapsed = typeof roll.currentTime === 'number' ? roll.currentTime : 0
    const slideRemaining = Math.max(ROLL_SLIDE_MS - (elapsed % ROLL_STEP_MS), 0)
    settleTimeoutRef.current = setTimeout(() => roll.pause(), slideRemaining)
  }

  // settle on the current logo while the list is open, even if the pointer stays on the trigger
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) handleRollEnd()
  }

  const handleAgentSelect = (agent: Agent) => {
    setIsOpen(false)
    onAgentSelect(agent)

    clearTimeout(settleTimeoutRef.current)
    rollRef.current?.cancel()
    rollRef.current = null
    setRestingTitle(agent.title)
    const target = new URL(agent.href, window.location.origin)
    const clientKey = target.searchParams.get(AGENT_CLIENT_PARAM)

    if (clientKey && target.pathname === pathname) {
      searchParams.set(AGENT_CLIENT_PARAM, clientKey)
      return
    }
    router.push(agent.href)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        onPointerEnter={handleRollStart}
        onPointerLeave={handleRollEnd}
        className={cn(ICON_BUTTON_CLASS_NAME, 'group w-auto gap-1.5 px-1.5')}
      >
        <span aria-hidden className="relative size-4 overflow-hidden">
          <span ref={trackRef} className="absolute inset-x-0 top-0 flex flex-col">
            {rollAgents.map((agent, index) => (
              <AgentLogo key={`${index}-${agent.title}`} agent={agent} />
            ))}
          </span>
        </span>
        <span className="text-sm">Set up agent</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className="transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 overflow-hidden rounded-lg p-0">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>No agent found.</CommandEmpty>
            {AGENTS.map((agent) => (
              <AgentOption key={agent.title} agent={agent} onAgentSelect={handleAgentSelect} />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const AgentOption = ({ agent, onAgentSelect }: AgentOptionProps) => {
  const handleSelect = () => onAgentSelect(agent)

  return (
    <CommandItem value={agent.title} onSelect={handleSelect} className="h-8 gap-2 rounded-md">
      <AgentLogo agent={agent} />
      {agent.title}
    </CommandItem>
  )
}

const AgentLogo = ({ agent }: AgentLogoProps) => (
  <span className="flex size-4 shrink-0 items-center justify-center">
    {agent.hasLightIcon ? (
      <img src={`${agent.icon}-light.svg`} alt="" className="size-3.5 dark:hidden" />
    ) : null}
    <img
      src={`${agent.icon}.svg`}
      alt=""
      className={cn('size-3.5', agent.hasLightIcon && 'hidden dark:block')}
    />
  </span>
)

const MarkdownIcon = () => (
  <svg width="18" height="18" viewBox="22.5 -21 170 170" fill="currentColor" aria-hidden>
    <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z" />
  </svg>
)
