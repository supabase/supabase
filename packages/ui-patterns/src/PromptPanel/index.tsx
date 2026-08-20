'use client'

import { Check, Copy } from 'lucide-react'
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
// shadcn tabs from packages/ui/src/components/shadcn/ui/tabs.tsx
import { cn, copyToClipboard, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

type PromptTitleProps = {
  children: ReactNode
  icon?: ReactNode
}

type PromptCopyProps = {
  children: string
}

type PromptContentProps = {
  children: ReactNode
  /** Draws attention with a text shimmer. Defaults to true. */
  shimmer?: boolean
}

type PromptProps = {
  children: ReactNode
  /** Stable tab id. Auto-generated when omitted. */
  value?: string
  /** When true, content starts collapsed with a show more / show less control. */
  expandable?: boolean
}

type PromptPanelProps = {
  children: ReactNode
  className?: string
  /**
   * When true, the panel resizes to fit the active tab's content — inactive
   * panes are unmounted. Default false: all panes stay mounted stacked in one
   * grid cell so the panel keeps the tallest tab's height (used by the docs
   * homepage, where a stable frame across tabs matters more than tight fit).
   */
  adaptiveHeight?: boolean
}

type CollectedPrompt = {
  value: string
  title: ReactNode
  icon?: ReactNode
  copyValue: string
  content: ReactNode
  expandable: boolean
  shimmer: boolean
}

function PromptTitle(_props: PromptTitleProps) {
  return null
}
PromptTitle.displayName = 'PromptTitle'

function PromptCopy(_props: PromptCopyProps) {
  return null
}
PromptCopy.displayName = 'PromptCopy'

function PromptContent(_props: PromptContentProps) {
  return null
}
PromptContent.displayName = 'PromptContent'

function Prompt(_props: PromptProps) {
  return null
}
Prompt.displayName = 'Prompt'

function isElementOfType(child: ReactNode, type: { displayName?: string }) {
  return (
    isValidElement(child) &&
    typeof child.type !== 'string' &&
    'displayName' in child.type &&
    child.type.displayName === type.displayName
  )
}

function collectPrompt(prompt: ReactElement<PromptProps>, index: number): CollectedPrompt {
  let title: ReactNode = `Prompt ${index + 1}`
  let icon: ReactNode | undefined
  let copyValue = ''
  let content: ReactNode = null
  let shimmer = true

  Children.forEach(prompt.props.children, (child) => {
    if (isElementOfType(child, PromptTitle)) {
      const props = (child as ReactElement<PromptTitleProps>).props
      title = props.children
      icon = props.icon
    } else if (isElementOfType(child, PromptCopy)) {
      copyValue = (child as ReactElement<PromptCopyProps>).props.children
    } else if (isElementOfType(child, PromptContent)) {
      const props = (child as ReactElement<PromptContentProps>).props
      content = props.children
      shimmer = props.shimmer !== false
    }
  })

  return {
    value: prompt.props.value ?? `prompt-${index}`,
    title,
    icon,
    copyValue,
    content,
    expandable: Boolean(prompt.props.expandable),
    shimmer,
  }
}

function collectPrompts(children: ReactNode): CollectedPrompt[] {
  return Children.toArray(children)
    .filter((child): child is ReactElement<PromptProps> => isElementOfType(child, Prompt))
    .map((prompt, index) => collectPrompt(prompt, index))
}

function ExpandableContent({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <div className="relative">
        <div className={cn(!isExpanded && 'max-h-28 overflow-hidden')}>{children}</div>
        {!isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <button
        tabIndex={0}
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="mt-2 cursor-pointer text-sm text-brand-link transition-colors hover:text-foreground focus-ring"
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}

function PromptBody({
  prompt,
  shimmerEnabled,
}: {
  prompt: CollectedPrompt
  shimmerEnabled: boolean
}) {
  const [shimmerMounted, setShimmerMounted] = useState(prompt.shimmer)

  const content = (
    <div
      className={cn(shimmerMounted && 'shimmer')}
      data-shimmer-fading={shimmerMounted && !shimmerEnabled ? true : undefined}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return
        if (shimmerMounted && !shimmerEnabled) {
          setShimmerMounted(false)
        }
      }}
    >
      {prompt.content}
    </div>
  )

  return (
    <div className="px-4 py-3.5 text-sm leading-6 text-foreground-light font-normal">
      {prompt.expandable ? <ExpandableContent>{content}</ExpandableContent> : content}
    </div>
  )
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  return (
    <button
      tabIndex={0}
      type="button"
      onClick={() => {
        copyToClipboard(value, () => {
          setCopied(true)
        })
      }}
      className="cursor-pointer rounded-sm p-1.5 text-foreground-muted transition-colors hover:bg-surface-200 hover:text-foreground focus-ring"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

function TabLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon && (
        <span aria-hidden="true" className="text-tertiary-foreground [&_svg]:size-3.5">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

const tabTriggerClassName = 'h-full px-0 py-0 text-xs shadow-none data-[state=active]:shadow-none'

/**
 * Copyable prompt card. Compose one or more `<Prompt>` children; multiple
 * prompts render as tabs. A single prompt still shows the header + copy
 * button, with the title styled like an inactive tab (no underline).
 *
 * The compound children (`Prompt`, `PromptTitle`, `PromptCopy`,
 * `PromptContent`) must be composed inside a client module — detection is
 * by `displayName`, which does not survive the RSC boundary.
 *
 * @example
 * ```tsx
 * <PromptPanel>
 *   <Prompt value="prompt" expandable>
 *     <PromptTitle icon={<Sparkles />}>AI Prompt</PromptTitle>
 *     <PromptCopy>Plain text copied to the clipboard</PromptCopy>
 *     <PromptContent>Rich content shown in the panel</PromptContent>
 *   </Prompt>
 * </PromptPanel>
 * ```
 */
function PromptPanel({ children, className, adaptiveHeight = false }: PromptPanelProps) {
  const fallbackId = useId()
  const titleId = useId()
  const prompts = collectPrompts(children)
  const [activeTab, setActiveTab] = useState(prompts[0]?.value ?? fallbackId)
  const [shimmerEnabled, setShimmerEnabled] = useState(true)

  if (prompts.length === 0) return null

  const activePrompt = prompts.find((prompt) => prompt.value === activeTab) ?? prompts[0]
  const hasTabs = prompts.length > 1
  const dismissShimmer = () => setShimmerEnabled(false)

  const header = (
    <div className="flex h-11 items-center justify-between border-b bg-surface-75 px-4">
      {hasTabs ? (
        <TabsList className="h-full gap-5 border-0">
          {prompts.map((prompt) => (
            <TabsTrigger key={prompt.value} value={prompt.value} className={tabTriggerClassName}>
              <TabLabel icon={prompt.icon}>{prompt.title}</TabLabel>
            </TabsTrigger>
          ))}
        </TabsList>
      ) : (
        <span
          id={titleId}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap border-b-2 border-transparent text-foreground-lighter',
            tabTriggerClassName
          )}
        >
          <TabLabel icon={prompts[0].icon}>{prompts[0].title}</TabLabel>
        </span>
      )}
      <CopyButton
        key={activePrompt.value}
        label={typeof activePrompt.title === 'string' ? activePrompt.title : 'content'}
        value={activePrompt.copyValue}
      />
    </div>
  )

  if (!hasTabs) {
    return (
      <div
        role="region"
        aria-labelledby={titleId}
        onFocusCapture={dismissShimmer}
        onPointerEnter={dismissShimmer}
        className={cn(
          'w-full overflow-hidden rounded-lg border bg-background shadow-sm',
          className
        )}
      >
        {header}
        <PromptBody prompt={prompts[0]} shimmerEnabled={shimmerEnabled} />
      </div>
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      // Manual activation keeps VoiceOver focus from switching tabs before Copy is reached.
      activationMode="manual"
      onFocusCapture={dismissShimmer}
      onPointerEnter={dismissShimmer}
      className={cn('w-full overflow-hidden rounded-lg border bg-background shadow-sm', className)}
    >
      {header}
      {adaptiveHeight ? (
        // Only the active pane renders, so the panel height tracks its content.
        // `min-w-0` on the grid track keeps long code lines from pushing the
        // whole panel past its column (they wrap or scroll inside instead).
        <div className="grid grid-cols-1">
          {prompts.map((prompt) => (
            <TabsContent key={prompt.value} value={prompt.value} className="m-0 min-w-0">
              <PromptBody prompt={prompt} shimmerEnabled={shimmerEnabled} />
            </TabsContent>
          ))}
        </div>
      ) : (
        /*
          Stack panes in one grid cell so the panel keeps the tallest tab's
          height. `grid-cols-1` pins the single track to `minmax(0, 1fr)` — without
          it the track sizes to the widest pane (e.g. a long cURL line), pushing
          the whole panel past its column. `min-w-0` on each pane then lets its
          content wrap (text) or scroll (code) instead of overflowing.
        */
        <div className="grid grid-cols-1">
          {prompts.map((prompt) => {
            const isActive = prompt.value === activeTab

            return (
              <TabsContent
                key={prompt.value}
                value={prompt.value}
                forceMount
                inert={!isActive}
                aria-hidden={!isActive}
                className="col-start-1 row-start-1 m-0 min-w-0 data-[state=inactive]:invisible data-[state=inactive]:pointer-events-none"
              >
                <PromptBody prompt={prompt} shimmerEnabled={shimmerEnabled} />
              </TabsContent>
            )
          })}
        </div>
      )}
    </Tabs>
  )
}

export { Prompt, PromptContent, PromptCopy, PromptPanel, PromptTitle }
export type { PromptContentProps, PromptCopyProps, PromptPanelProps, PromptProps, PromptTitleProps }
