import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare,
  NotebookText,
  Play,
  Plus,
  SquareCode,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'ui'

type Section = 'home' | 'query' | 'notebook' | 'chat'

const Line = ({ className }: { className?: string }) => (
  <div className={cn('h-1 shrink-0 rounded-[2px] bg-border-stronger', className)} />
)

const Icon = ({ icon: IconComponent, className }: { icon: LucideIcon; className?: string }) => (
  <IconComponent size={10} strokeWidth={1.5} className={cn('shrink-0', className)} />
)

const SidebarRow = ({
  icon,
  isActive = false,
  trailing,
  lineClassName = 'w-10',
}: {
  icon: LucideIcon
  isActive?: boolean
  trailing?: ReactNode
  lineClassName?: string
}) => (
  <div
    className={cn(
      'flex h-5 items-center gap-1.5 rounded-sm px-1.5',
      isActive ? 'bg-surface-300 text-foreground' : 'text-foreground-muted'
    )}
  >
    <Icon icon={icon} />
    <Line className={cn(lineClassName, isActive && 'bg-foreground-muted')} />
    <div className="ml-auto flex items-center gap-1">{trailing}</div>
  </div>
)

const Count = () => <div className="h-1.5 w-1.5 rounded-full bg-border-stronger" />

const SidebarHome = ({ section }: { section: Section }) => (
  <>
    <div className="space-y-px">
      <SidebarRow
        icon={SquareCode}
        isActive={section === 'query'}
        trailing={<Icon icon={Plus} />}
        lineClassName="w-9"
      />
      <SidebarRow
        icon={NotebookText}
        trailing={
          <>
            <Count />
            <Icon icon={ChevronRight} />
          </>
        }
        lineClassName="w-12"
      />
      <SidebarRow
        icon={MessageSquare}
        isActive={section === 'chat'}
        trailing={
          <>
            <Count />
            <Icon icon={ChevronRight} />
          </>
        }
        lineClassName="w-8"
      />
    </div>
    <div className="space-y-px">
      <Line className="mx-1.5 mb-2 w-14 bg-foreground-muted/50" />
      <SidebarRow icon={NotebookText} lineClassName="w-14" />
      <SidebarRow icon={MessageSquare} isActive={section === 'chat'} lineClassName="w-12" />
      <SidebarRow icon={NotebookText} lineClassName="w-10" />
      <SidebarRow icon={MessageSquare} lineClassName="w-14" />
    </div>
  </>
)

const SidebarNotebooks = () => (
  <>
    <div className="flex h-5 items-center rounded-sm border bg-surface-200 px-1.5">
      <Line className="w-12" />
    </div>
    <div className="space-y-px">
      <SidebarRow icon={NotebookText} isActive lineClassName="w-14" />
      <SidebarRow icon={NotebookText} lineClassName="w-10" />
      <SidebarRow icon={NotebookText} lineClassName="w-16" />
      <SidebarRow icon={NotebookText} lineClassName="w-12" />
      <SidebarRow icon={NotebookText} lineClassName="w-9" />
    </div>
  </>
)

const Sidebar = ({ section }: { section: Section }) => (
  <div className="flex w-[24%] shrink-0 flex-col border-r">
    <div className="flex h-7 shrink-0 items-center gap-1 border-b px-2.5 text-foreground-muted">
      {section === 'notebook' && <Icon icon={ChevronLeft} />}
      <Line className={cn('bg-foreground-muted', section === 'notebook' ? 'w-12' : 'w-10')} />
      <div className="ml-auto flex h-3.5 w-3.5 items-center justify-center rounded-sm border">
        <Icon icon={Plus} className="size-2" />
      </div>
    </div>
    <div className="flex flex-col gap-3 p-1.5">
      {section === 'notebook' ? <SidebarNotebooks /> : <SidebarHome section={section} />}
    </div>
  </div>
)

const TAB_ICONS: Record<Exclude<Section, 'home'>, LucideIcon> = {
  query: SquareCode,
  notebook: NotebookText,
  chat: MessageSquare,
}

const Tab = ({ icon, isActive = false }: { icon: LucideIcon; isActive?: boolean }) => (
  <div
    className={cn(
      'flex h-full items-center gap-1.5 border-r px-2.5',
      isActive ? 'bg-surface-200 text-foreground' : 'text-foreground-muted'
    )}
  >
    <Icon icon={icon} />
    <Line className={cn('w-8', isActive && 'bg-foreground-muted')} />
  </div>
)

const TabBar = ({ section }: { section: Section }) => (
  <div className="flex h-7 shrink-0 items-stretch border-b">
    <div
      className={cn(
        'flex items-center border-r px-2.5',
        section === 'home' ? 'bg-surface-200 text-foreground' : 'text-foreground-muted'
      )}
    >
      <Icon icon={Home} />
    </div>
    {section !== 'home' && <Tab icon={TAB_ICONS[section]} isActive />}
    <Tab icon={section === 'notebook' ? SquareCode : NotebookText} />
    <div className="flex items-center px-2 text-foreground-muted">
      <Icon icon={Plus} />
    </div>
  </div>
)

const ExplorerFrame = ({ section, children }: { section: Section; children: ReactNode }) => (
  <div
    aria-hidden="true"
    className="flex aspect-video w-full overflow-hidden rounded-md border bg-muted shadow-sm"
  >
    <Sidebar section={section} />
    <div className="flex min-w-0 flex-1 flex-col">
      <TabBar section={section} />
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  </div>
)

const SqlLines = ({ rows = 3 }: { rows?: number }) => {
  const widths = [
    ['w-6', 'w-14'],
    ['w-5', 'w-10'],
    ['w-6', 'w-16'],
    ['w-4', 'w-8'],
  ]

  return (
    <div className="space-y-1.5">
      {widths.slice(0, rows).map(([keyword, rest], index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="w-2 text-right font-mono text-[6px] leading-none text-foreground-muted">
            {index + 1}
          </span>
          <Line className={cn(keyword, 'bg-foreground-muted')} />
          <Line className={rest} />
        </div>
      ))}
    </div>
  )
}

const ResultsGrid = ({ rows = 3, className }: { rows?: number; className?: string }) => (
  <div className={cn('divide-y overflow-hidden rounded-sm border', className)}>
    {Array.from({ length: rows + 1 }).map((_, row) => (
      <div key={row} className="grid grid-cols-4 gap-2 px-2 py-1.5">
        {Array.from({ length: 4 }).map((_, col) => (
          <Line key={col} className={cn(row === 0 ? 'w-3/4 bg-foreground-muted' : 'w-1/2')} />
        ))}
      </div>
    ))}
  </div>
)

const BarChart = ({ className }: { className?: string }) => (
  <div className={cn('flex items-end gap-1 rounded-sm border p-2', className)}>
    {[35, 55, 45, 70, 60, 85, 75, 95].map((height, index) => (
      <div
        key={index}
        className="flex-1 rounded-t-[1px] bg-border-stronger"
        style={{ height: `${height}%` }}
      />
    ))}
  </div>
)

const RunButton = () => (
  <div className="flex h-4 items-center gap-1 rounded-sm border bg-surface-300 px-1.5 text-foreground-muted">
    <Icon icon={Play} className="size-2 fill-current" />
    <div className="h-0.5 w-4 rounded-[2px] bg-foreground-muted" />
  </div>
)

const HomeContent = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-8">
    <Line className="w-2/3 bg-foreground-muted" />
    <div className="w-full space-y-3 rounded-md border bg-surface-200 p-2">
      <Line className="w-1/2" />
      <div className="flex justify-end">
        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground-muted text-background">
          <Icon icon={ArrowUp} className="size-2" />
        </div>
      </div>
    </div>
    <div className="grid w-full grid-cols-2 gap-2">
      {[SquareCode, NotebookText].map((icon, index) => (
        <div key={index} className="flex items-center gap-1.5 rounded-md border bg-surface-200 p-2">
          <div className="flex h-4 w-4 items-center justify-center rounded-sm border bg-surface-300 text-foreground-muted">
            <Icon icon={icon} className="size-2" />
          </div>
          <div className="space-y-1">
            <Line className="w-10 bg-foreground-muted" />
            <Line className="w-14" />
          </div>
        </div>
      ))}
    </div>
    <div className="w-full space-y-1.5">
      <Line className="w-12" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-6 rounded-md border bg-surface-200" />
        ))}
      </div>
    </div>
  </div>
)

const QueryContent = () => (
  <div className="flex h-full flex-col">
    <div className="flex h-6 shrink-0 items-center justify-between border-b px-2">
      <Line className="w-10" />
      <RunButton />
    </div>
    <div className="flex-1 p-2">
      <SqlLines rows={4} />
    </div>
    <ResultsGrid rows={5} className="h-1/2 shrink-0 rounded-none border-x-0 border-b-0" />
  </div>
)

const MarkdownCell = ({ lines }: { lines: string[] }) => (
  <div className="space-y-1.5 px-1">
    <Line className="w-1/4 bg-foreground-muted" />
    {lines.map((width, index) => (
      <Line key={index} className={width} />
    ))}
  </div>
)

const NotebookContent = () => (
  <div className="h-full overflow-hidden px-6 pb-3 pt-6">
    <div className="space-y-2.5">
      <MarkdownCell lines={['w-5/6', 'w-2/3']} />
      <BarChart className="h-16" />
      <div className="flex items-center gap-1.5 text-foreground-muted">
        <div className="h-px flex-1 bg-border" />
        <Icon icon={Plus} />
        <div className="h-px flex-1 bg-border" />
      </div>
      <MarkdownCell lines={['w-3/4']} />
      <BarChart className="h-16" />
    </div>
  </div>
)

const ChatContent = () => (
  <div className="flex h-full flex-col px-6 py-3">
    <div className="flex flex-1 flex-col gap-2.5 overflow-hidden">
      <div className="ml-auto w-1/2 space-y-1.5 rounded-md border bg-surface-300 p-2">
        <Line className="w-full" />
        <Line className="w-2/3" />
      </div>
      <div className="w-5/6 space-y-2">
        <div className="space-y-1.5">
          <Line className="w-full" />
          <Line className="w-4/5" />
        </div>
        <BarChart className="h-16" />
        <Line className="w-2/3" />
      </div>
    </div>
    <div className="flex shrink-0 items-center justify-between rounded-md border bg-surface-200 py-1.5 pl-2 pr-1.5">
      <span className="text-[8px] leading-none text-foreground-muted">
        Ask a follow up question...
      </span>
      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground-muted text-background">
        <Icon icon={ArrowUp} className="size-2" />
      </div>
    </div>
  </div>
)

export const WelcomeWireframe = () => (
  <ExplorerFrame section="home">
    <HomeContent />
  </ExplorerFrame>
)

export const RunSqlWireframe = () => (
  <ExplorerFrame section="query">
    <QueryContent />
  </ExplorerFrame>
)

export const NotebooksWireframe = () => (
  <ExplorerFrame section="notebook">
    <NotebookContent />
  </ExplorerFrame>
)

export const ChatWireframe = () => (
  <ExplorerFrame section="chat">
    <ChatContent />
  </ExplorerFrame>
)
