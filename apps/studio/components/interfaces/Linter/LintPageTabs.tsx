import { MessageSquareMore } from 'lucide-react'

import { InformationCircleIcon } from '@heroicons/react/16/solid'

import {
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'

import { LINTER_LEVELS, LINT_TABS } from 'components/interfaces/Linter/Linter.constants'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Lint } from 'data/lint/lint-query'
import { useRouter } from 'next/router'

interface LintPageTabsProps {
  currentTab: string
  setCurrentTab: (value: LINTER_LEVELS) => void
  setSelectedLint: (value: Lint | null) => void
  isLoading: boolean
  activeLints: Lint[]
}
const LintPageTabs = ({
  currentTab,
  setCurrentTab,
  setSelectedLint,
  isLoading,
  activeLints,
}: LintPageTabsProps) => {
  const router = useRouter()

  const warnLintsCount = activeLints.filter((x) => x.level === 'WARN').length
  const errorLintsCount = activeLints.filter((x) => x.level === 'ERROR').length
  const infoLintsCount = activeLints.filter((x) => x.level === 'INFO').length

  const LintCountLabel = ({ tab }: { tab: (typeof LINT_TABS)[number] }) => {
    let count = 0
    let label = ''
    if (tab.id === LINTER_LEVELS.ERROR) {
      count = errorLintsCount
      label = 'errors'
    }

    if (tab.id === LINTER_LEVELS.WARN) {
      count = warnLintsCount
      label = 'warnings'
    }

    if (tab.id === LINTER_LEVELS.INFO) {
      count = infoLintsCount
      label = 'suggestions'
    }

    return (
      <span className="text-xs text-foreground-muted group-hover:text-foreground-lighter group-data-[state=active]:text-foreground-lighter transition">
        {isLoading ? (
          <ShimmeringLoader className="w-20 pt-1" />
        ) : (
          <>
            {count} {label}
          </>
        )}
      </span>
    )
  }

  return (
    <Tabs_Shadcn_
      defaultValue={currentTab}
      onValueChange={(value) => {
        setCurrentTab(value as LINTER_LEVELS)
        setSelectedLint(null)
        const { sort, search, ...rest } = router.query
        router.push({ ...router, query: { ...rest, preset: value, id: null } })
      }}
    >
      <TabsList_Shadcn_ className={cn('flex gap-0 border-0 items-end z-10 relative')}>
        {LINT_TABS.map((tab) => (
          <TabsTrigger_Shadcn_
            key={tab.id}
            value={tab.id}
            className={cn(
              'group relative',
              'px-6 py-3 border-b-0 flex flex-col items-start !shadow-none border-default border-t',
              'even:border-x last:border-r even:!border-x-strong last:!border-r-strong',
              tab.id === currentTab ? '!bg-surface-200' : '!bg-surface-200/[33%]',
              'hover:!bg-surface-100',
              'data-[state=active]:!bg-surface-200',
              'hover:text-foreground-light',
              'transition'
            )}
          >
            {tab.id === currentTab && (
              <div className="absolute top-0 left-0 w-full h-[1px] bg-foreground" />
            )}
            <div className="flex items-center gap-x-2">
              <span
                className={
                  tab.id === LINTER_LEVELS.ERROR
                    ? 'text-destructive-600'
                    : tab.id === LINTER_LEVELS.WARN
                      ? 'text-warning-600'
                      : 'text-brand-500'
                }
              >
                <MessageSquareMore size={14} fill="currentColor" strokeWidth={0} />
              </span>

              <span className="">{tab.label}</span>
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <InformationCircleIcon className="transition text-foreground-muted w-3 h-3 data-[state=delayed-open]:text-foreground-light" />
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="top">{tab.description}</TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
            </div>
            <LintCountLabel tab={tab} />
          </TabsTrigger_Shadcn_>
        ))}
      </TabsList_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default LintPageTabs
