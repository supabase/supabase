import { ArrowRight, ChevronDown, Search, X } from 'lucide-react'
import {
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
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
import { TOPICS, type Topic } from '../lib/topics'

export interface GuideBrowserProps {
  guides: GuideSummary[]
  className?: string
}

interface TopicTabsProps {
  activeTopic: Topic | null
  isHidden: boolean
  onTopicSelect: (topic: Topic | null) => void
  className?: string
}

interface TopicTabProps {
  topic: Topic | null
  rollIndex: number
}

interface SearchToggleProps {
  isHidden: boolean
  onOpen: () => void
}

interface SearchTabProps {
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
}

interface GuideListProps {
  guides: GuideSummary[]
  activeTopic: Topic | null
  query: string
  onTopicClear: () => void
  onQueryClear: () => void
}

type RollStyle = CSSProperties & { '--roll-index': number }

const TOPIC_CHANGE_EVENT = 'kb:topicchange'
const PAGE_SIZE = 16
const INLINE_TOPIC_COUNT = 7
const INLINE_TOPICS = TOPICS.slice(0, INLINE_TOPIC_COUNT).map((topic) => topic.name)
const MORE_TOPICS = TOPICS.slice(INLINE_TOPIC_COUNT).map((topic) => topic.name)

const ROW_HEIGHT = 56
const PANEL_CHROME = 18
const LOAD_MORE_ROW = 82

const TOPIC_TAB_CLASS =
  'shrink-0 whitespace-nowrap rounded-md py-2 text-sm tracking-[-0.011em] transition-colors focus-inset'

const ROLL_CLASS = cn(
  'transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
  'delay-[calc(var(--roll-index)*25ms)]',
  'group-data-[search-open=true]/topic-tabs:-translate-y-2 group-data-[search-open=true]/topic-tabs:opacity-0'
)

const ALL_TOPICS_VALUE = 'all'

const ROW_DIVIDER_CLASS = cn(
  'border-b border-dashed border-muted last:border-b-0 transition-colors',
  'hover:border-transparent has-[+li:hover]:border-transparent',
  'has-[:focus-visible]:border-transparent has-[+li_:focus-visible]:border-transparent'
)

const ROW_LINK_CLASS = cn(
  'group -mx-4 flex min-h-14 flex-col gap-1 rounded-md px-4 py-3 transition-colors',
  'hover:bg-surface-200 focus-visible:bg-surface-200 focus-visible:outline-hidden',
  'sm:flex-row sm:items-center sm:gap-8 sm:py-0'
)

const listMinHeight = (total: number) => {
  const rows = Math.min(total, PAGE_SIZE)
  if (rows === 0) return undefined
  return rows * ROW_HEIGHT + (rows - 1) + PANEL_CHROME + (total > PAGE_SIZE ? LOAD_MORE_ROW : 0)
}

const rollStyle = (index: number): RollStyle => ({ '--roll-index': index })

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

const focusOnMount = (input: HTMLInputElement | null) => input?.focus()

export const GuideBrowser = ({ guides, className }: GuideBrowserProps) => {
  const activeTopic = useSyncExternalStore(subscribeToTopic, getTopicFromUrl, getTopicOnServer)
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const visibleGuides = filterGuides({ guides, topic: activeTopic, query })
  const filterKey = `${activeTopic ?? ''}|${query}`
  const [paging, setPaging] = useState({ filterKey, count: PAGE_SIZE })
  const shownCount = paging.filterKey === filterKey ? paging.count : PAGE_SIZE
  const shownGuides = visibleGuides.slice(0, shownCount)
  const hasMore = visibleGuides.length > shownCount

  const handleTabChange = (value: string) => setTopicInUrl(fromTabValue(value))
  const handleSearchOpen = () => {
    setTopicInUrl(null)
    setIsSearchOpen(true)
  }
  const handleSearchClose = () => {
    setQuery('')
    setIsSearchOpen(false)
  }
  const handleLoadMore = () => setPaging({ filterKey, count: shownCount + PAGE_SIZE })
  const handleTopicClear = () => setTopicInUrl(null)
  const handleQueryClear = () => setQuery('')

  return (
    <section
      aria-label="All guides"
      className={cn('mx-auto flex w-full max-w-6xl flex-col gap-10 px-6', className)}
    >
      <Tabs
        value={toTabValue(activeTopic)}
        onValueChange={handleTabChange}
        data-search-open={isSearchOpen}
        className="group/topic-tabs tab-flares flex flex-col"
      >
        <div className="relative flex items-end">
          <TopicTabs
            activeTopic={activeTopic}
            isHidden={isSearchOpen}
            onTopicSelect={setTopicInUrl}
            className="flex-1"
          />
          <SearchToggle isHidden={isSearchOpen} onOpen={handleSearchOpen} />
          {isSearchOpen ? (
            <SearchTab query={query} onQueryChange={setQuery} onClose={handleSearchClose} />
          ) : null}
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
          style={{ minHeight: listMinHeight(guides.length) }}
          className="mt-0 rounded-lg border border-default bg-200 px-6 py-2"
        >
          <p aria-live="polite" className="sr-only">
            {`${shownGuides.length} of ${visibleGuides.length} ${visibleGuides.length === 1 ? 'guide' : 'guides'} shown`}
          </p>
          <GuideList
            guides={shownGuides}
            activeTopic={activeTopic}
            query={query}
            onTopicClear={handleTopicClear}
            onQueryClear={handleQueryClear}
          />
          {hasMore ? (
            <div className="flex justify-center py-6">
              <Button variant="default" size="small" onClick={handleLoadMore}>
                Load more
              </Button>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  )
}

const TopicTabs = ({ activeTopic, isHidden, onTopicSelect, className }: TopicTabsProps) => {
  const activeMoreTopic = MORE_TOPICS.find((topic) => topic === activeTopic) ?? null
  const tabTopics = [null, ...INLINE_TOPICS, ...(activeMoreTopic ? [activeMoreTopic] : [])]
  const handleMoreSelect = (value: string) =>
    onTopicSelect(MORE_TOPICS.find((topic) => topic === value) ?? null)

  return (
    <TabsList
      aria-label="Topics"
      inert={isHidden}
      className={cn(
        'relative z-1 -mb-px min-w-0 border-b-0 overflow-x-auto no-scrollbar has-focus-visible:z-2',
        'has-[[data-tab-indicator]]:after:hidden',
        className
      )}
    >
      {tabTopics.map((topic, index) => (
        <TopicTab key={toTabValue(topic)} topic={topic} rollIndex={index} />
      ))}
      {MORE_TOPICS.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(TOPIC_TAB_CLASS, 'text-foreground-lighter hover:text-foreground')}
          >
            <span
              style={rollStyle(tabTopics.length)}
              className={cn(ROLL_CLASS, 'flex items-center gap-1 px-3')}
            >
              More
              <ChevronDown aria-hidden className="size-3.5" strokeWidth={2.25} />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuRadioGroup value={activeMoreTopic ?? ''} onValueChange={handleMoreSelect}>
              {MORE_TOPICS.map((topic) => (
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
          'after:bg-(image:--tab-flare-right)',
          'group-data-[search-open=true]/topic-tabs:w-80!'
        )}
      />
    </TabsList>
  )
}

const TopicTab = ({ topic, rollIndex }: TopicTabProps) => (
  <TabsTrigger
    value={toTabValue(topic)}
    className={cn(TOPIC_TAB_CLASS, 'relative z-1 data-[state=active]:shadow-none')}
  >
    <span style={rollStyle(rollIndex)} className={cn(ROLL_CLASS, 'block px-3')}>
      {topic ?? 'All'}
    </span>
  </TabsTrigger>
)

const SearchToggle = ({ isHidden, onOpen }: SearchToggleProps) => (
  <button
    type="button"
    inert={isHidden}
    onClick={onOpen}
    className={cn(TOPIC_TAB_CLASS, 'cursor-pointer text-foreground-lighter hover:text-foreground')}
  >
    <span
      style={rollStyle(INLINE_TOPIC_COUNT + 2)}
      className={cn(ROLL_CLASS, 'flex items-center gap-1.5 px-3')}
    >
      <Search aria-hidden className="size-3.5" strokeWidth={2.25} />
      Search
    </span>
  </button>
)

const SearchTab = ({ query, onQueryChange, onClose }: SearchTabProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') onClose()
  }

  return (
    <div
      className={cn(
        'absolute left-0 top-0 -bottom-px z-3 flex w-full max-w-80 items-center gap-2 pl-3 pr-1',
        'motion-safe:animate-[reveal-up_250ms_cubic-bezier(0.23,1,0.32,1)_150ms_both]'
      )}
    >
      <Search
        aria-hidden
        className="size-3.5 shrink-0 text-foreground-lighter"
        strokeWidth={2.25}
      />
      <input
        ref={focusOnMount}
        type="search"
        aria-label="Search guides"
        placeholder="Search guides…"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-sm text-foreground outline-hidden',
          'border-0 p-0 shadow-none focus:border-transparent focus:shadow-none focus:ring-0',
          'placeholder:text-foreground-lighter [&::-webkit-search-cancel-button]:appearance-none'
        )}
      />
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-ring"
      >
        <X aria-hidden className="size-3.5" strokeWidth={2.25} />
      </button>
    </div>
  )
}

const GuideList = ({ guides, activeTopic, query, onTopicClear, onQueryClear }: GuideListProps) => {
  if (guides.length === 0) {
    const emptyState = emptyStateFor({ topic: activeTopic, query })
    return (
      <div className="flex flex-col items-start gap-3 py-8">
        <p className="m-0 text-sm text-foreground-light">{emptyState.message}</p>
        <button
          type="button"
          onClick={emptyState.isSearch ? onQueryClear : onTopicClear}
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
          className={cn(ROW_DIVIDER_CLASS, REVEAL_ITEM_CLASS)}
        >
          <a href={guide.href} className={ROW_LINK_CLASS}>
            <span className="flex-1 text-sm font-medium tracking-[-0.013em] text-foreground">
              {guide.title}
            </span>
            <span className="text-sm tracking-[-0.013em] text-foreground-lighter sm:w-42.5 sm:shrink-0">
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
