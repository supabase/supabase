'use client'

import { ChevronDownIcon } from 'lucide-react'
import {
  Children,
  isValidElement,
  useId,
  useState,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { cn, Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from 'ui'

import { CodeCopyButton } from './CodeBlock/CodeBlockControls'

type PromptTitleProps = {
  children: ReactNode
}

type PromptCopyProps = {
  children: string
}

type PromptContentProps = {
  children: ReactNode
  shimmer?: boolean
}

type PromptProps = {
  children: ReactNode
  value?: string
  expandable?: boolean
}

type PromptPanelProps = {
  children: ReactNode
  className?: string
  onCopied?: (value: string) => void
}

type CollectedPrompt = {
  value: string
  title: ReactNode
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

function isElementOfType<Props>(
  child: ReactNode,
  type: ComponentType<Props>
): child is ReactElement<Props> {
  return (
    isValidElement(child) &&
    typeof child.type !== 'string' &&
    'displayName' in child.type &&
    child.type.displayName === type.displayName
  )
}

function collectPrompt(prompt: ReactElement<PromptProps>, index: number): CollectedPrompt {
  let title: ReactNode = `Prompt ${index + 1}`
  let copyValue = ''
  let content: ReactNode = null
  let shimmer = true

  Children.forEach(prompt.props.children, (child) => {
    if (isElementOfType(child, PromptTitle)) {
      title = child.props.children
    } else if (isElementOfType(child, PromptCopy)) {
      copyValue = child.props.children
    } else if (isElementOfType(child, PromptContent)) {
      const props = child.props
      content = props.children
      shimmer = props.shimmer !== false
    }
  })

  return {
    value: prompt.props.value ?? `prompt-${index}`,
    title,
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
  const [isHoverRevealPaused, setIsHoverRevealPaused] = useState(false)

  const handleReelPointerLeave = () => setIsHoverRevealPaused(false)
  const handleToggle = () => {
    if (isExpanded) setIsHoverRevealPaused(true)
    setIsExpanded((expanded) => !expanded)
  }

  return (
    <div
      className="group/expand relative h-full px-4 py-3.5"
      onPointerLeave={handleReelPointerLeave}
    >
      <div
        className={cn(
          'overflow-hidden [interpolate-size:allow-keywords] transition-all duration-300 ease-out motion-reduce:transition-none',
          isExpanded ? 'max-h-max' : 'max-h-28'
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-4 bottom-3.5 h-16 bg-gradient-to-t from-background-200 to-transparent',
          'transition-opacity duration-300 ease-out motion-reduce:transition-none',
          isExpanded && 'opacity-0'
        )}
      />
      <div
        className={cn('flex justify-center', isExpanded ? 'mt-3' : 'absolute inset-x-0 bottom-3.5')}
      >
        <button
          key={String(isExpanded)}
          tabIndex={0}
          type="button"
          onClick={handleToggle}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1 text-xs text-foreground',
            'bg-surface-200/90 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm',
            'transition duration-200 ease-out',
            'hover:bg-surface-300 active:scale-[0.96] focus-ring',
            !isExpanded &&
              'translate-y-1 opacity-0 focus-visible:translate-y-0 focus-visible:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100 motion-reduce:translate-y-0',
            !isExpanded &&
              !isHoverRevealPaused &&
              'group-hover/expand:translate-y-0 group-hover/expand:opacity-100'
          )}
          aria-expanded={isExpanded}
        >
          <ChevronDownIcon
            aria-hidden="true"
            size={14}
            className={cn(isExpanded && 'rotate-180')}
          />
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
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
    <div
      className={cn(
        'h-full bg-200 text-sm leading-6 text-foreground-light font-normal',
        !prompt.expandable && 'px-4 py-3.5'
      )}
    >
      {prompt.expandable ? <ExpandableContent>{content}</ExpandableContent> : content}
    </div>
  )
}

function PromptMarkdown({ children }: { children: string }) {
  return (
    <div className="not-prose flex flex-col gap-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li+li]:mt-1">
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{children}</ReactMarkdown>
    </div>
  )
}

function PromptCode({ children }: { children?: ReactNode }) {
  return <code className="shimmer-none">{children}</code>
}

const MARKDOWN_COMPONENTS = { code: PromptCode }

const tabTriggerClassName = cn(
  'h-full px-0 py-0 text-xs shadow-none data-[state=active]:shadow-none',
  'group-has-[[data-tab-indicator]]/list:border-b',
  'group-data-[tab-indicator-ready]/list:data-[state=active]:border-b-transparent'
)

function PromptPanel({ children, className, onCopied }: PromptPanelProps) {
  const fallbackId = useId()
  const titleId = useId()
  const prompts = collectPrompts(children)
  const [activeTab, setActiveTab] = useState(prompts[0]?.value ?? fallbackId)
  const [shimmerEnabled, setShimmerEnabled] = useState(true)

  if (prompts.length === 0) return null

  const activePrompt = prompts.find((prompt) => prompt.value === activeTab) ?? prompts[0]
  const hasTabs = prompts.length > 1
  const dismissShimmer = () => setShimmerEnabled(false)

  const copyTarget = typeof activePrompt.title === 'string' ? activePrompt.title : 'content'

  const header = (
    <div className="flex h-11 items-center justify-between pl-4 pr-2 border-b [--btn-active:color-mix(in_srgb,var(--foreground)_4%,var(--background-200))]">
      {hasTabs ? (
        <TabsList className="h-full gap-5 border-0 [--tab-track:transparent]">
          {prompts.map((prompt) => (
            <TabsTrigger key={prompt.value} value={prompt.value} className={tabTriggerClassName}>
              {prompt.title}
            </TabsTrigger>
          ))}
          <TabsIndicator />
        </TabsList>
      ) : (
        <span
          id={titleId}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap border-b-2 border-transparent text-foreground-lighter',
            tabTriggerClassName
          )}
        >
          {prompts[0].title}
        </span>
      )}
      <CodeCopyButton
        key={activePrompt.value}
        content={activePrompt.copyValue}
        label={`Copy ${copyTarget}`}
        copiedLabel={`${copyTarget} copied`}
        onCopied={() => onCopied?.(activePrompt.value)}
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
          'w-full overflow-hidden rounded-lg border border-default shadow-(--shadow-codeblock)',
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
      className={cn(
        'w-full overflow-hidden rounded-lg border border-default shadow-(--shadow-codeblock)',
        className
      )}
    >
      {header}
      <div className="grid">
        {prompts.map((prompt) => {
          const isActive = prompt.value === activeTab

          return (
            <TabsContent
              key={prompt.value}
              value={prompt.value}
              forceMount
              tabIndex={-1}
              inert={!isActive}
              aria-hidden={!isActive}
              className="col-start-1 row-start-1 m-0 data-[state=inactive]:invisible data-[state=inactive]:pointer-events-none"
            >
              <PromptBody prompt={prompt} shimmerEnabled={shimmerEnabled} />
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
}

export { Prompt, PromptCode, PromptContent, PromptCopy, PromptMarkdown, PromptPanel, PromptTitle }
export type { PromptContentProps, PromptCopyProps, PromptPanelProps, PromptProps, PromptTitleProps }
