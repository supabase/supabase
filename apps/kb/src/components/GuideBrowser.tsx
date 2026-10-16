import { ArrowRight, ChevronDown } from 'lucide-react'
import { Fragment, useState, useSyncExternalStore } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from 'ui'

import {
  emptyStateFor,
  filterGuides,
  parseTopicParam,
  withTopicParam,
  type GuideSummary,
} from '../lib/guides'
import { bindRevealOnce, REVEAL_GROUP_CLASS, REVEAL_ITEM_CLASS, revealStyle } from '../lib/reveal'
import { FORMAT_TOPICS, TOPICS, type Topic } from '../lib/topics'

export interface GuideBrowserProps {
  guides: GuideSummary[]
  className?: string
}

interface TopicTabsProps {
  topics: Topic[]
  activeTopic: Topic | null
  onTopicSelect: (topic: Topic | null) => void
  className?: string
}

interface TopicTabProps {
  topic: Topic | null
}

interface GuideListProps {
  guides: GuideSummary[]
  activeTopic: Topic | null
  onTopicClear: () => void
}

const TOPIC_CHANGE_EVENT = 'kb:topicchange'
const PAGE_SIZE = 16
const INLINE_TOPIC_COUNT = 7
const VISIBLE_TOPICS = TOPICS.filter((topic) => topic.visible).map((topic) => topic.name)

const ALL_TOPICS_VALUE = 'all'

// css can't animate between two auto heights. the panel copies the measured content height into an explicit height
const bindPanelHeight = (content: HTMLDivElement | null) => {
  const panel = content?.parentElement
  if (!content || !panel) return
  const observer = new ResizeObserver(([entry]) => {
    panel.style.height = `${entry.contentRect.height}px`
  })
  observer.observe(content)
  return () => observer.disconnect()
}

const toTabValue = (topic: Topic | null) => topic ?? ALL_TOPICS_VALUE

const fromTabValue = (value: string) => TOPICS.find((topic) => topic.name === value)?.name ?? null

const subscribeToTopic = (onChange: () => void) => {
  window.addEventListener('popstate', onChange)
  window.addEventListener(TOPIC_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(TOPIC_CHANGE_EVENT, onChange)
  }
}

const getTopicFromUrl = () =>
  parseTopicParam(new URLSearchParams(window.location.search).get('topic'))

const getTopicOnServer = () => null

const setTopicInUrl = (topic: Topic | null) => {
  const { pathname, search, hash } = window.location
  window.history.replaceState(null, '', `${pathname}${withTopicParam({ search, topic })}${hash}`)
  window.dispatchEvent(new Event(TOPIC_CHANGE_EVENT))
}

export const GuideBrowser = ({ guides, className }: GuideBrowserProps) => {
  const activeTopic = useSyncExternalStore(subscribeToTopic, getTopicFromUrl, getTopicOnServer)
  const visibleGuides = filterGuides({ guides, topic: activeTopic })
  const filterKey = activeTopic ?? ''
  const [paging, setPaging] = useState({ filterKey, count: PAGE_SIZE })
  const shownCount = paging.filterKey === filterKey ? paging.count : PAGE_SIZE
  const shownGuides = visibleGuides.slice(0, shownCount)
  const hasMore = visibleGuides.length > shownCount

  const handleTabChange = (value: string) => setTopicInUrl(fromTabValue(value))
  const handleLoadMore = () => setPaging({ filterKey, count: shownCount + PAGE_SIZE })
  const handleTopicClear = () => setTopicInUrl(null)

  return (
    <section
      aria-label="All guides"
      className={cn('mx-auto flex w-full max-w-6xl flex-col gap-10 px-6', className)}
    >
      <Tabs
        value={toTabValue(activeTopic)}
        onValueChange={handleTabChange}
        className="group/topic-tabs tab-flares flex flex-col"
      >
        <div className="relative flex items-end">
          <TopicTabs
            topics={VISIBLE_TOPICS.filter((topic) =>
              guides.some((guide) => guide.topics.includes(topic))
            )}
            activeTopic={activeTopic}
            onTopicSelect={setTopicInUrl}
            className="flex-1"
          />
        </div>
        <span aria-hidden className="relative z-1 block h-0">
          <span
            className={cn(
              'absolute left-0 top-0 size-2 border-l border-default bg-200 opacity-0',
              'transition-opacity duration-150 ease-move motion-reduce:transition-none',
              'group-has-[[role=tab]:first-child[data-state=active]]/topic-tabs:opacity-100',
              'group-has-[[role=tab]:first-child[data-state=active]]/topic-tabs:duration-400'
            )}
          />
        </span>
        <TabsContent
          value={toTabValue(activeTopic)}
          className={cn(
            'mt-0 box-content overflow-hidden rounded-lg border border-default bg-200 px-6 py-2',
            'transition-[height] duration-300 ease-move motion-reduce:transition-none'
          )}
        >
          <div ref={bindPanelHeight}>
            <p aria-live="polite" className="sr-only">
              {`${shownGuides.length} of ${visibleGuides.length} ${visibleGuides.length === 1 ? 'guide' : 'guides'} shown`}
            </p>
            <GuideList
              guides={shownGuides}
              activeTopic={activeTopic}
              onTopicClear={handleTopicClear}
            />
            {hasMore ? (
              <div className="flex justify-center py-6">
                <Button variant="default" size="small" onClick={handleLoadMore}>
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

const TopicTabs = ({ topics, activeTopic, onTopicSelect, className }: TopicTabsProps) => {
  const inlineTopics = topics.slice(0, INLINE_TOPIC_COUNT)
  const moreTopics = topics.slice(INLINE_TOPIC_COUNT)
  const activeMoreTopic = moreTopics.find((topic) => topic === activeTopic) ?? null
  const tabTopics = [null, ...inlineTopics, ...(activeMoreTopic ? [activeMoreTopic] : [])]
  const firstProductIndex = tabTopics.findIndex(
    (topic) => topic !== null && !FORMAT_TOPICS.includes(topic)
  )
  const handleMoreSelect = (value: string) =>
    onTopicSelect(moreTopics.find((topic) => topic === value) ?? null)

  return (
    <TabsList
      aria-label="Topics"
      className={cn(
        'relative z-1 -mb-px min-w-0 border-b-0 overflow-x-auto no-scrollbar has-focus-visible:z-2',
        'has-[[data-tab-indicator]]:after:hidden',
        className
      )}
    >
      {tabTopics.map((topic, index) => (
        <Fragment key={toTabValue(topic)}>
          {index === firstProductIndex && index > 1 ? (
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 self-center bg-border" />
          ) : null}
          <TopicTab topic={topic} />
        </Fragment>
      ))}
      {moreTopics.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'shrink-0 whitespace-nowrap rounded-md py-2 text-sm tracking-body transition-colors focus-inset',
              'text-foreground-lighter hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-1 px-3">
              More
              <ChevronDown aria-hidden className="size-3.5" strokeWidth={2.25} />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuRadioGroup value={activeMoreTopic ?? ''} onValueChange={handleMoreSelect}>
              {moreTopics.map((topic) => (
                <DropdownMenuRadioItem key={topic} value={topic}>
                  {topic}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <TabsIndicator
        className={cn(
          'top-0 h-auto rounded-t-lg border border-b-0 border-default bg-200',
          'before:absolute before:bottom-0 before:-left-2 before:size-2',
          'before:transition-opacity before:duration-150 before:ease-move motion-reduce:before:transition-none',
          'group-has-[[role=tab]:first-child[data-state=active]]/topic-tabs:before:opacity-0',
          'before:bg-(image:--tab-flare-left)',
          'after:absolute after:bottom-0 after:-right-2 after:size-2',
          'after:bg-(image:--tab-flare-right)'
        )}
      />
    </TabsList>
  )
}

const TopicTab = ({ topic }: TopicTabProps) => (
  <TabsTrigger
    value={toTabValue(topic)}
    className={cn(
      'shrink-0 whitespace-nowrap rounded-md py-2 text-sm tracking-body transition-colors focus-inset',
      'relative z-1 data-[state=active]:shadow-none'
    )}
  >
    <span className="block px-3">{topic ?? 'All'}</span>
  </TabsTrigger>
)

const GuideList = ({ guides, activeTopic, onTopicClear }: GuideListProps) => {
  if (guides.length === 0) {
    const emptyState = emptyStateFor({ topic: activeTopic })
    return (
      <div className="flex flex-col items-start gap-3 py-8">
        <p className="m-0 text-sm text-foreground-light">{emptyState.message}</p>
        <button
          type="button"
          onClick={onTopicClear}
          className="text-sm text-foreground underline underline-offset-4 focus-ring rounded-sm"
        >
          {emptyState.action}
        </button>
      </div>
    )
  }

  return (
    <ul ref={bindRevealOnce} className={cn('m-0 flex list-none flex-col p-0', REVEAL_GROUP_CLASS)}>
      {guides.map((guide, index) => (
        <li
          key={guide.id}
          style={revealStyle(index % PAGE_SIZE)}
          className={cn(
            'border-b border-dashed border-muted last:border-b-0 transition-colors',
            'hover:border-transparent has-[+li:hover]:border-transparent',
            'has-[:focus-visible]:border-transparent has-[+li_:focus-visible]:border-transparent',
            REVEAL_ITEM_CLASS
          )}
        >
          <a
            href={guide.href}
            className={cn(
              'group -mx-4 flex min-h-14 flex-col gap-1 rounded-md px-4 py-3 transition-colors',
              'hover:bg-surface-200 focus-visible:bg-surface-200 focus-visible:outline-hidden',
              'sm:flex-row sm:items-center sm:gap-8 sm:py-0'
            )}
          >
            <span className="flex-1 text-sm font-medium tracking-body text-foreground">
              {guide.title}
            </span>
            <span className="text-sm tracking-body text-foreground-lighter sm:w-42.5 sm:shrink-0">
              {guide.topics.join(', ')}
            </span>
            <span className="hidden w-26 shrink-0 items-center justify-end gap-2 text-sm font-medium text-foreground-light transition-colors group-hover:text-foreground sm:flex">
              Read guide
              <ArrowRight
                aria-hidden
                className="size-3.5 text-foreground-muted transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.25}
              />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
