'use client'

import { SUPPORTED_AGENTS } from '~/data/content-listings/ai-tools.data'
import { AGENT_CLIENT_PARAM } from '~/features/ui/AgentPluginsPanel.data'
import { CrossfadeIcon } from 'ui-patterns/CodeBlock/CodeBlockControls'
import { BASE_PATH } from '~/lib/constants'
import { mdAlternate } from '~/lib/md-alternates'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useSearchParamsShallow } from 'common'
import { ChevronDown, Copy, createLucideIcon, Link, MousePointer2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Button,
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
  key: string
  label: string
  href: string
  icon: string
  hasLightIcon?: boolean
}

interface PageActionButtonsProps {
  className?: string
}

interface MarkdownActionsProps {
  markdownPath: string
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

const AGENTS = SUPPORTED_AGENTS.reduce<Agent[]>(
  (agents, { key, label, href, icon, hasLightIcon }) => {
    if (!icon) return agents
    agents.push({ key, label, href, icon, hasLightIcon })
    return agents
  },
  []
)

const ROLL_STEPS = AGENTS.length

const ROLL_STEP_MS = 800
const ROLL_SLIDE_MS = 320
const ROLL_EASING = 'cubic-bezier(0.77, 0, 0.175, 1)'

// the slot slide and the roll keyframes read the same timing, so they stay in sync
const ROLL_SLIDE_STYLE: CSSProperties = {
  transitionDuration: `${ROLL_SLIDE_MS}ms`,
  transitionTimingFunction: ROLL_EASING,
}

const ROLL_KEYFRAMES: Keyframe[] = [
  { offset: 0, transform: 'translateY(0px)' },
  ...Array.from({ length: ROLL_STEPS }, (_, step) => [
    {
      offset: (step + 1 - ROLL_SLIDE_MS / ROLL_STEP_MS) / ROLL_STEPS,
      transform: `translateY(${step * -16}px)`,
      easing: ROLL_EASING,
    },
    {
      offset: (step + 1) / ROLL_STEPS,
      transform: `translateY(${(step + 1) * -16}px)`,
    },
  ]).flat(),
]

export const PageActionButtons = ({ className }: PageActionButtonsProps) => {
  const pathname = usePathname() ?? ''
  const sendTelemetryEvent = useSendTelemetryEvent()

  const isGuide = pathname.startsWith('/guides/')
  // guides built from app routes, like the cli config page, have no markdown version
  const markdownAlternate = isGuide ? mdAlternate(pathname.slice('/guides/'.length)) : undefined
  // reference pages have no markdown export, so they only get the agent setup
  if (!isGuide && !pathname.startsWith('/reference/')) return null

  const handleAgentSetup = (agent: Agent) =>
    sendTelemetryEvent({ action: 'agent_setup_clicked', properties: { agent: agent.key } })

  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      {markdownAlternate ? (
        <MarkdownActions
          markdownPath={`${BASE_PATH}${pathname}.md`}
          markdownUrl={markdownAlternate['text/markdown']}
        />
      ) : null}
      <AgentCombobox onAgentSelect={handleAgentSetup} />
    </div>
  )
}

const MarkdownActions = ({ markdownPath, markdownUrl }: MarkdownActionsProps) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const [isCopied, setIsCopied] = useState(false)

  const showCopied = () => {
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // the promise goes straight to the clipboard so safari keeps the click's permission
  const handleCopyPage = () =>
    copyToClipboard(
      fetch(markdownPath).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${markdownPath}`)
        return response.text()
      }),
      () => {
        sendTelemetryEvent({
          action: 'copy_as_markdown_clicked',
          properties: { pageType: 'guide' },
        })
        showCopied()
      }
    )

  const handleCopyUrl = () =>
    copyToClipboard(markdownUrl, () => {
      sendTelemetryEvent({ action: 'markdown_url_copied', properties: { pageType: 'guide' } })
      showCopied()
    })

  const handleViewMarkdown = () =>
    sendTelemetryEvent({ action: 'view_as_markdown_clicked', properties: { pageType: 'guide' } })

  return (
    <div className="flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Copy page"
            aria-describedby={undefined}
            onClick={handleCopyPage}
            icon={
              <CrossfadeIcon active={isCopied} activeIcon={CircleCheckFilled} inactiveIcon={Copy} />
            }
            className="group/btn h-7.5 rounded-r-none px-2 hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">{isCopied ? 'Copied' : 'Copy page'}</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="More page actions"
            icon={
              <ChevronDown
                strokeWidth={2}
                className="transition-transform duration-150 group-data-[state=open]:rotate-180"
              />
            }
            className="group -ml-px h-7.5 shrink-0 rounded-l-none px-1.5 focus-visible:z-10 focus-visible:rounded-l-sm"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 overflow-hidden rounded-lg">
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
            <a href={markdownPath} onClick={handleViewMarkdown}>
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
  const [isHovering, setIsHovering] = useState(false)
  const [restingKey, setRestingKey] = useState('claude-code')
  const trackRef = useRef<HTMLSpanElement>(null)
  const rollRef = useRef<Animation | null>(null)
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const restingIndex = Math.max(
    AGENTS.findIndex((agent) => agent.key === restingKey),
    0
  )
  const rollAgents = [
    ...AGENTS.slice(restingIndex),
    ...AGENTS.slice(0, restingIndex),
    AGENTS[restingIndex],
  ]
  const isShowingAgents = isHovering && !isOpen

  const handleRollStart = () => {
    setIsHovering(true)
    if (isOpen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    clearTimeout(settleTimeoutRef.current)
    if (rollRef.current) {
      rollRef.current.play()
      return
    }
    rollRef.current =
      trackRef.current?.animate(ROLL_KEYFRAMES, {
        duration: ROLL_STEPS * ROLL_STEP_MS,
        iterations: Infinity,
        // wait for the slot to slide in, so the first logo holds as long as the others
        delay: ROLL_SLIDE_MS,
      }) ?? null
  }
  const handleRollEnd = () => {
    const roll = rollRef.current
    if (!roll) return
    // reset once the slot slides out, so the next hover starts at the first logo
    settleTimeoutRef.current = setTimeout(() => {
      roll.cancel()
      rollRef.current = null
    }, ROLL_SLIDE_MS)
  }
  const handlePointerLeave = () => {
    setIsHovering(false)
    handleRollEnd()
  }

  // stop the roll while the list is open, even if the pointer stays on the trigger
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
    setRestingKey(agent.key)

    if (new URL(agent.href, window.location.origin).pathname === pathname) {
      searchParams.set(AGENT_CLIENT_PARAM, agent.key)
      return
    }
    router.push(agent.href)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          onPointerEnter={handleRollStart}
          onPointerLeave={handlePointerLeave}
          icon={
            <span className="relative block size-4 overflow-hidden">
              <span
                style={ROLL_SLIDE_STYLE}
                className={cn(
                  'absolute inset-0 overflow-hidden transition-transform motion-reduce:transition-none',
                  isShowingAgents ? 'translate-y-0' : 'translate-y-full'
                )}
              >
                <span ref={trackRef} className="absolute inset-x-0 top-0 flex flex-col">
                  {rollAgents.map((agent, index) => (
                    <AgentLogo key={`${index}-${agent.key}`} agent={agent} />
                  ))}
                </span>
              </span>
              <MousePointer2
                style={ROLL_SLIDE_STYLE}
                className={cn(
                  'absolute inset-0 size-4! p-px transition-transform motion-reduce:transition-none',
                  isShowingAgents ? '-translate-y-full' : 'translate-y-0'
                )}
              />
            </span>
          }
          iconRight={
            <ChevronDown
              strokeWidth={2}
              className="transition-transform duration-150 group-data-[state=open]:rotate-180"
            />
          }
          className="group h-7.5 pl-1.5"
        >
          Set up agent
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 overflow-hidden rounded-lg p-0">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList className="max-h-80">
            <CommandEmpty>No agent found.</CommandEmpty>
            {AGENTS.map((agent) => (
              <AgentOption key={agent.key} agent={agent} onAgentSelect={handleAgentSelect} />
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
    <CommandItem value={agent.label} onSelect={handleSelect} className="h-8 gap-2 rounded-md">
      <AgentLogo agent={agent} />
      {agent.label}
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
