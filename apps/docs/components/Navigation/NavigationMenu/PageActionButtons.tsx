'use client'

import { BASE_PATH, PROD_URL } from '~/lib/constants'
import { useDocsPathname } from '~/features/IaNav/IaNavRouteProvider'
import { mdUrl } from '~/lib/md-alternates'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { askAiUrls } from 'common/markdown-affordance'
import { safeLocalStorage } from 'common/safe-storage'
import type { PageActionsOrigin } from 'common/telemetry-constants'
import { Chatgpt, Claude } from 'icons'
import { ChevronDown, Copy, createLucideIcon, Link, type LucideIcon } from 'lucide-react'
import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  Button,
  cn,
  copyToClipboard,
  CrossfadeIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface PageActionButtonsProps {
  className?: string
}

type ActionVerb = (typeof ACTION_VERBS)[number]

type PageActionId = 'copy-page' | 'copy-url' | 'view-markdown' | 'ask-chatgpt' | 'ask-claude'

interface MarkdownActionsProps {
  pageUrl: string
  markdownPath: string
  markdownUrl: string
}

interface PageActionBase {
  id: PageActionId
  verb: ActionVerb
  icon: LucideIcon
  title: string
  onRun: (origin: PageActionsOrigin) => void
}

interface ClipboardPageAction extends PageActionBase {
  href?: undefined
}

interface LinkPageAction extends PageActionBase {
  href: string
  isExternal?: boolean
}

type PageAction = ClipboardPageAction | LinkPageAction

interface ActionVerbLabelProps {
  verb: ActionVerb
}

interface PageActionMenuItemProps {
  action: PageAction
  onActionRun: (action: PageAction, origin: PageActionsOrigin) => void
}

interface PageActionLabelProps {
  icon: ReactNode
  title: string
}

// the check is a hole in the circle, so any button fill shows through it
const CircleCheckFilled = createLucideIcon('CircleCheckFilled', [
  [
    'path',
    {
      d: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20ZM9.707 11.293 11 12.586l3.293-3.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414Z',
      fill: 'currentColor',
      fillRule: 'evenodd',
      stroke: 'none',
      key: 'circle-check',
    },
  ],
])

const MarkdownIcon = createLucideIcon('Markdown', [
  [
    'path',
    {
      d: 'M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z',
      transform: 'scale(0.1412) translate(-22.5 21)',
      fill: 'currentColor',
      stroke: 'none',
      key: 'markdown',
    },
  ],
])

const ACTION_VERBS = ['Copy', 'View', 'Ask'] as const

const subscribeToNothing = () => () => {}

const getLinkTarget = (action: LinkPageAction) =>
  action.isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : undefined

export const PageActionButtons = ({ className }: PageActionButtonsProps) => {
  const pathname = useDocsPathname()
  // guides built from app routes, like the cli config page, have no markdown version
  const markdownUrl = pathname.startsWith('/guides/')
    ? mdUrl(pathname.slice('/guides/'.length))
    : undefined
  if (!markdownUrl) return null

  return (
    <div className={cn('flex shrink-0 items-center', className)}>
      <MarkdownActions
        key={pathname}
        pageUrl={`${PROD_URL}${pathname}`}
        markdownPath={`${BASE_PATH}${pathname}.md`}
        markdownUrl={markdownUrl}
      />
    </div>
  )
}

const MarkdownActions = ({ pageUrl, markdownPath, markdownUrl }: MarkdownActionsProps) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const [isCopied, setIsCopied] = useState(false)
  const [pickedActionId, setPickedActionId] = useState<PageActionId>()
  const storedActionId = useSyncExternalStore(
    subscribeToNothing,
    () => safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.DOCS_PAGE_ACTION),
    () => null
  )
  const askAiUrl = askAiUrls(pageUrl)
  const markdownRequestRef = useRef<Promise<string> | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isPointerMenuRef = useRef(false)

  const rememberAction = (id: PageActionId) => {
    setPickedActionId(id)
    safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.DOCS_PAGE_ACTION, id)
  }

  // the button keeps its old icon under the check, and takes the new action when the check fades
  const showCopied = (id: PageActionId) => {
    setIsCopied(true)
    // a new copy restarts the check, so an older timer must not end it early
    clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => {
      setIsCopied(false)
      rememberAction(id)
    }, 2000)
  }

  // the load starts on hover or focus, so the copy does not wait for the network
  const loadMarkdown = () => {
    if (!markdownRequestRef.current) {
      const request = fetch(markdownPath).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${markdownPath}`)
        return response.text()
      })
      // a failed load is not kept, so the next copy tries again
      request.catch(() => {
        markdownRequestRef.current = null
      })
      markdownRequestRef.current = request
    }
    return markdownRequestRef.current
  }

  // the clipboard gets the promise, so safari keeps the permission of the click
  const handleCopyPage = (origin: PageActionsOrigin) =>
    copyToClipboard(loadMarkdown(), () => {
      sendTelemetryEvent({
        action: 'copy_as_markdown_clicked',
        properties: { pageType: 'guide', origin },
      })
      showCopied('copy-page')
    })

  const handleCopyUrl = (origin: PageActionsOrigin) =>
    copyToClipboard(markdownUrl, () => {
      sendTelemetryEvent({
        action: 'markdown_url_copied',
        properties: { pageType: 'guide', origin },
      })
      showCopied('copy-url')
    })

  const handleViewMarkdown = (origin: PageActionsOrigin) =>
    sendTelemetryEvent({
      action: 'view_as_markdown_clicked',
      properties: { pageType: 'guide', origin },
    })

  const handleAskAi = (agent: 'chatgpt' | 'claude', origin: PageActionsOrigin) =>
    sendTelemetryEvent({
      action: 'ask_ai_clicked',
      properties: { agent, pageType: 'guide', origin },
    })

  const actions: PageAction[] = [
    {
      id: 'copy-page',
      verb: 'Copy',
      icon: Copy,
      title: 'Copy page',
      onRun: handleCopyPage,
    },
    {
      id: 'copy-url',
      verb: 'Copy',
      icon: Link,
      title: 'Copy Markdown URL',
      onRun: handleCopyUrl,
    },
    {
      id: 'view-markdown',
      verb: 'View',
      icon: MarkdownIcon,
      title: 'View as Markdown',
      href: markdownPath,
      onRun: handleViewMarkdown,
    },
    {
      id: 'ask-chatgpt',
      verb: 'Ask',
      icon: Chatgpt,
      title: 'Ask ChatGPT',
      href: askAiUrl.chatgpt,
      isExternal: true,
      onRun: (origin) => handleAskAi('chatgpt', origin),
    },
    {
      id: 'ask-claude',
      verb: 'Ask',
      icon: Claude,
      title: 'Ask Claude',
      href: askAiUrl.claude,
      isExternal: true,
      onRun: (origin) => handleAskAi('claude', origin),
    },
  ]
  // a stored id from an older action list matches nothing, so the button falls back to copy page
  const primaryAction =
    actions.find((action) => action.id === (pickedActionId ?? storedActionId)) ?? actions[0]

  const handleActionRun = (action: PageAction, origin: PageActionsOrigin) => {
    // a copy action takes the button after its check, so only links take it at once
    if (action.href !== undefined) rememberAction(action.id)
    action.onRun(origin)
  }

  const handlePrimaryActionRun = () => handleActionRun(primaryAction, 'page_actions_button')

  const primaryIcon = (
    <CrossfadeIcon
      active={isCopied}
      activeIcon={CircleCheckFilled}
      inactiveIcon={primaryAction.icon}
    />
  )

  const handleMenuPointerDown = () => {
    isPointerMenuRef.current = true
  }

  const handleMenuKeyDown = () => {
    isPointerMenuRef.current = false
  }

  // radix moves focus back to the trigger, so a pointer choice would leave a focus ring on it
  const handleMenuCloseAutoFocus = (event: Event) => {
    if (isPointerMenuRef.current) event.preventDefault()
  }

  return (
    <div className="flex" onPointerEnter={loadMarkdown} onFocus={loadMarkdown}>
      <Tooltip>
        <TooltipTrigger asChild>
          {primaryAction.href !== undefined ? (
            <Button
              asChild
              icon={primaryIcon}
              className={cn(
                'group/btn h-7.5 min-w-7.5 rounded-r-none pl-2 pr-2.5',
                'hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm'
              )}
            >
              <a
                href={primaryAction.href}
                {...getLinkTarget(primaryAction)}
                aria-label={primaryAction.title}
                aria-describedby={undefined}
                onClick={handlePrimaryActionRun}
              >
                <ActionVerbLabel verb={primaryAction.verb} />
              </a>
            </Button>
          ) : (
            <Button
              aria-label={primaryAction.title}
              aria-describedby={undefined}
              onClick={handlePrimaryActionRun}
              icon={primaryIcon}
              className={cn(
                'group/btn h-7.5 min-w-7.5 rounded-r-none pl-2 pr-2.5',
                'hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm'
              )}
            >
              <ActionVerbLabel verb={primaryAction.verb} />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{isCopied ? 'Copied' : primaryAction.title}</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="More page actions"
            onPointerDown={handleMenuPointerDown}
            onKeyDown={handleMenuKeyDown}
            icon={
              <ChevronDown className="transition-transform duration-150 group-aria-expanded:rotate-180" />
            }
            className="group -ml-px h-7.5 min-w-7.5 shrink-0 rounded-l-none px-0 focus-visible:z-10 focus-visible:rounded-l-sm"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onPointerDown={handleMenuPointerDown}
          onKeyDown={handleMenuKeyDown}
          onCloseAutoFocus={handleMenuCloseAutoFocus}
          className="w-64 overflow-hidden rounded-lg"
        >
          {actions.map((action) => (
            <PageActionMenuItem key={action.id} action={action} onActionRun={handleActionRun} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="sr-only" role="status">
        {isCopied ? 'Copied to clipboard' : ''}
      </span>
    </div>
  )
}

const ActionVerbLabel = ({ verb }: ActionVerbLabelProps) => (
  <span aria-hidden className="grid">
    {ACTION_VERBS.map((item) => (
      <span key={item} className={cn('col-start-1 row-start-1', item !== verb && 'invisible')}>
        {item}
      </span>
    ))}
  </span>
)

const PageActionMenuItem = ({ action, onActionRun }: PageActionMenuItemProps) => {
  const handleSelect = () => onActionRun(action, 'page_actions_menu')
  const label = <PageActionLabel icon={<action.icon className="size-3.5" />} title={action.title} />

  return action.href ? (
    <DropdownMenuItem asChild>
      <a href={action.href} {...getLinkTarget(action)} onClick={handleSelect}>
        {label}
      </a>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem onSelect={handleSelect}>{label}</DropdownMenuItem>
  )
}

const PageActionLabel = ({ icon, title }: PageActionLabelProps) => (
  <span className="flex items-center gap-2">
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center text-foreground-lighter"
    >
      {icon}
    </span>
    <span className="text-sm text-foreground">{title}</span>
  </span>
)
