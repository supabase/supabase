import { ChevronDown } from 'lucide-react'
import { Fragment, useId, useState, useSyncExternalStore } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsFolderCorner,
  TabsFolderIndicator,
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
import { FORMAT_TOPICS, isKnownTopic, TOPICS, type Topic } from '../lib/topics'
import { AsciiHoverText } from './AsciiHoverText'

export interface GuideBrowserProps {
  title: string
  guides: GuideSummary[]
  // url search param for the active topic. each browser on a page needs its own
  param?: string
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

// the hostname of an off-site link, e.g. "dev.to". null for the kb's own pages
const getExternalHost = (href: string) =>
  /^https?:\/\//.test(href) ? new URL(href).hostname.replace(/^www\./, '') : null

const toTabValue = (topic: Topic | null) => topic ?? 'all'

const subscribeToTopic = (onChange: () => void) => {
  window.addEventListener('popstate', onChange)
  window.addEventListener(TOPIC_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(TOPIC_CHANGE_EVENT, onChange)
  }
}

const getTopicOnServer = () => null

export const GuideBrowser = ({ title, guides, param = 'topic', className }: GuideBrowserProps) => {
  const headingId = useId()
  const getTopicFromUrl = () =>
    parseTopicParam(new URLSearchParams(window.location.search).get(param))
  const activeTopic = useSyncExternalStore(subscribeToTopic, getTopicFromUrl, getTopicOnServer)
  const visibleGuides = filterGuides({ guides, topic: activeTopic })
  const filterKey = activeTopic ?? ''
  const [paging, setPaging] = useState({ filterKey, count: PAGE_SIZE })
  const shownCount = paging.filterKey === filterKey ? paging.count : PAGE_SIZE
  const shownGuides = visibleGuides.slice(0, shownCount)
  const hasMore = visibleGuides.length > shownCount

  const setTopicInUrl = (topic: Topic | null) => {
    const { pathname, search, hash } = window.location
    const nextSearch = withTopicParam({ search, topic, param })
    window.history.replaceState(null, '', `${pathname}${nextSearch}${hash}`)
    window.dispatchEvent(new Event(TOPIC_CHANGE_EVENT))
  }
  const handleTabChange = (value: string) => setTopicInUrl(isKnownTopic(value) ? value : null)
  const handleLoadMore = () => setPaging({ filterKey, count: shownCount + PAGE_SIZE })
  const handleTopicClear = () => setTopicInUrl(null)
  const filterTopics = TOPICS.filter(
    (topic) =>
      topic.visible &&
      guides.some((guide) => guide.topics.includes(topic.name)) &&
      // a topic that every guide has would list the same guides as all
      !guides.every((guide) => guide.topics.includes(topic.name))
  ).map((topic) => topic.name)

  return (
    <section
      aria-labelledby={headingId}
      className={cn('mx-auto flex w-full max-w-6xl flex-col gap-8 px-6', className)}
    >
      <h2
        id={headingId}
        className="m-0 font-sans! text-xl font-medium! tracking-title text-foreground"
      >
        <AsciiHoverText text={title} glyphClassName="after:text-foreground" />
      </h2>
      <Tabs
        value={toTabValue(activeTopic)}
        onValueChange={handleTabChange}
        className="flex flex-col"
      >
        <div className="relative flex items-end">
          <TopicTabs
            topics={filterTopics}
            activeTopic={activeTopic}
            onTopicSelect={setTopicInUrl}
            className="flex-1"
          />
        </div>
        <TabsFolderCorner active={activeTopic === null} />
        <TabsContent
          value={toTabValue(activeTopic)}
          className={cn(
            'mt-0 box-content overflow-hidden rounded-lg border border-default bg-200 pl-3.75 pr-4 py-1',
            'transition-[height] duration-250 ease-out motion-reduce:transition-none'
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
              <div className="flex justify-center pt-7 pb-5">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1 pl-2.5 pr-3 text-xs text-foreground',
                    'bg-surface-200/90 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm',
                    'transition duration-200 ease-out',
                    'hover:bg-surface-300 active:scale-[0.96] focus-ring'
                  )}
                >
                  <ChevronDown aria-hidden className="size-3.5" />
                  Load more
                </button>
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
            <span className="flex items-center gap-1 px-4">
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
      <TabsFolderIndicator />
    </TabsList>
  )
}

const TopicTab = ({ topic }: TopicTabProps) => (
  <TabsTrigger
    value={toTabValue(topic)}
    className={cn(
      'shrink-0 whitespace-nowrap rounded-md py-2 text-sm tracking-body transition-[color] focus-inset',
      'relative z-1 data-[state=active]:shadow-none',
      // indicator set before hydration
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:rounded-b-none',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:rounded-t-lg',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:bg-200',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:before:absolute',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:before:inset-0',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:before:rounded-t-lg',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:before:border',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:before:border-b-0',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:before:border-default',
      'tab-flares group-not-data-[tab-indicator-ready]/list:data-[state=active]:after:absolute',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:after:bottom-0',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:after:-right-1.75',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:after:size-2',
      'group-not-data-[tab-indicator-ready]/list:data-[state=active]:after:bg-(image:--tab-flare-right)'
    )}
  >
    <span className="block px-4">{topic ?? 'All'}</span>
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
    <ul className="m-0 flex list-none flex-col p-0">
      {guides.map((guide) => {
        const externalHost = getExternalHost(guide.href)
        return (
          <li
            // guide and troubleshooting slugs can be the same. hrefs are unique
            key={guide.href}
            className={cn(
              'border-b border-dashed border-muted last:border-b-0',
              'hover:border-transparent has-[+li:hover]:border-transparent',
              'has-[:focus-visible]:border-transparent has-[+li_:focus-visible]:border-transparent'
            )}
          >
            <a
              href={guide.href}
              // community guides link off-site
              {...(externalHost && { target: '_blank', rel: 'noopener noreferrer' })}
              className={cn(
                'group -ml-2.75 -mr-3 flex min-h-14 flex-col gap-1 rounded-md pl-2.75 pr-3 py-3',
                'hover:bg-surface-200 focus-visible:bg-surface-200 focus-visible:outline-hidden',
                'sm:flex-row sm:items-center sm:gap-8 sm:py-0'
              )}
            >
              <span className="min-w-0 flex-1 text-sm font-medium tracking-body text-foreground">
                {guide.title}
                {externalHost ? (
                  <span className="ml-1 text-foreground-light">
                    {' by '}
                    <img
                      // google serves a favicon for any host, so contributors do not upload a logo
                      src={`https://www.google.com/s2/favicons?domain=${externalHost}&sz=32`}
                      alt=""
                      width={16}
                      height={16}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="mx-1 inline size-4 rounded-sm align-text-bottom"
                    />
                    {guide.author ?? externalHost}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                ) : null}
              </span>
              <span className="text-sm tracking-body text-foreground-lighter sm:max-w-1/2 sm:shrink-0 sm:truncate sm:text-right">
                {guide.topics.join(', ')}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
