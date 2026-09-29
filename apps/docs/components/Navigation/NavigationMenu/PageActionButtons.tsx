'use client'

import { aiToolsSupportedAgents } from '~/data/content-listings/ai-tools.data'
import { AGENT_CLIENT_PARAM } from '~/features/ui/AgentPluginsPanel.data'
import { CrossfadeIcon } from '~/features/ui/CodeBlock/CodeBlock.client'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useSearchParamsShallow } from 'common'
import { ChevronDown, Copy, createLucideIcon, Link } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState, type ReactNode } from 'react'
import {
  cn,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface MarkdownActionsProps {
  markdownUrl: string
}

interface MarkdownActionProps {
  icon: ReactNode
  title: string
  description: string
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

const TRIGGER_CLASS_NAME = cn(
  'flex h-7.5 items-center gap-1.5 px-2 text-sm text-foreground-lighter',
  'transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'
)

const PILL_CLASS_NAME = 'rounded-md border border-default'

const CHEVRON_CLASS_NAME = 'transition-transform duration-150 group-data-[state=open]:rotate-180'

const MENU_CLASS_NAME = 'w-64 overflow-hidden rounded-lg'

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

  const isGuide = pathname.startsWith('/guides/')
  // reference pages have no markdown export, so they only get the agent setup
  if (!isGuide && !pathname.startsWith('/reference/')) return null

  const handleAgentSetup = (agent: Agent) =>
    sendTelemetryEvent({ action: 'agent_setup_clicked', properties: { agent: agent.title } })

  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      {isGuide ? <MarkdownActions markdownUrl={`/docs${pathname}.md`} /> : null}
      <AgentCombobox onAgentSelect={handleAgentSetup} />
    </div>
  )
}

const MarkdownActions = ({ markdownUrl }: MarkdownActionsProps) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const [isCopied, setIsCopied] = useState(false)

  const showCopied = () => {
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // the promise goes straight to the clipboard so safari keeps the click's permission
  const handleCopyPage = () =>
    copyToClipboard(
      fetch(markdownUrl).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${markdownUrl}`)
        return response.text()
      }),
      () => {
        sendTelemetryEvent({ action: 'docs_page_markdown_copied' })
        showCopied()
      }
    )

  const handleCopyUrl = () =>
    copyToClipboard(`https://supabase.com${markdownUrl}`, () => {
      sendTelemetryEvent({ action: 'docs_markdown_url_copied' })
      showCopied()
    })

  const handleViewMarkdown = () => sendTelemetryEvent({ action: 'docs_view_as_markdown_clicked' })

  return (
    <div className={cn('flex items-center', PILL_CLASS_NAME)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={0}
            aria-label="Copy page"
            aria-describedby={undefined}
            onClick={handleCopyPage}
            className={cn(TRIGGER_CLASS_NAME, 'group/btn rounded-l-md')}
          >
            <CrossfadeIcon active={isCopied} activeIcon={CircleCheckFilled} inactiveIcon={Copy} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{isCopied ? 'Copied' : 'Copy page'}</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More page actions"
          className={cn(TRIGGER_CLASS_NAME, 'group rounded-r-md border-l border-default px-1.5')}
        >
          <ChevronDown size={14} strokeWidth={2} aria-hidden className={CHEVRON_CLASS_NAME} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={MENU_CLASS_NAME}>
          <DropdownMenuItem onSelect={handleCopyPage}>
            <MarkdownAction
              icon={<Copy size={14} />}
              title="Copy page"
              description="Copy this page as Markdown for LLMs"
            />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyUrl}>
            <MarkdownAction
              icon={<Link size={14} />}
              title="Copy Markdown URL"
              description="Share a link agents can fetch"
            />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={markdownUrl} onClick={handleViewMarkdown}>
              <MarkdownAction
                icon={<MarkdownIcon />}
                title="View as Markdown"
                description="Open this page as plain text"
              />
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="sr-only" role="status">
        {isCopied ? 'Copied to clipboard' : ''}
      </span>
    </div>
  )
}

const MarkdownAction = ({ icon, title, description }: MarkdownActionProps) => (
  <span className="flex items-start gap-2">
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center text-foreground-lighter"
    >
      {icon}
    </span>
    <span className="flex flex-col">
      <span className="text-sm text-foreground">{title}</span>
      <span className="text-xs text-foreground-lighter">{description}</span>
    </span>
  </span>
)

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
        className={cn(TRIGGER_CLASS_NAME, PILL_CLASS_NAME, 'group pl-1.5')}
      >
        <span aria-hidden className="relative size-4 overflow-hidden">
          <span ref={trackRef} className="absolute inset-x-0 top-0 flex flex-col">
            {rollAgents.map((agent, index) => (
              <AgentLogo key={`${index}-${agent.title}`} agent={agent} />
            ))}
          </span>
        </span>
        Set up agent
        <ChevronDown size={14} strokeWidth={2} aria-hidden className={CHEVRON_CLASS_NAME} />
      </PopoverTrigger>
      <PopoverContent align="end" className={cn(MENU_CLASS_NAME, 'p-0')}>
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
  <svg width="16" height="16" viewBox="22.5 -21 170 170" fill="currentColor" aria-hidden>
    <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z" />
  </svg>
)
