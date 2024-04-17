import { Eye, MessageSquareMore, Table2, TextSearch, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { InformationCircleIcon } from '@heroicons/react/16/solid'
import { useParams } from 'common'

import { lintInfoMap } from 'components/interfaces/Reports/ReportLints.utils'
import { DatabaseLayout } from 'components/layouts'
import { FormHeader } from 'components/ui/Forms'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks'
import { useRouter } from 'next/router'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  LoadingLine,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { FilterPopover } from 'components/ui/FilterPopover'
import ReactMarkdown from 'react-markdown'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { Markdown } from '../../../../components/interfaces/Markdown'
import {
  LintCTA,
  entityTypeIcon,
} from '../../../../components/interfaces/Reports/ReportLints.utils'

enum LINTER_LEVELS {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}

const LINT_TABS = [
  {
    id: LINTER_LEVELS.ERROR,
    label: 'Errors',
    description: 'You should consider these issues urgent and and fix them as soon as you can.',
  },
  {
    id: LINTER_LEVELS.WARN,
    label: 'Warnings ',
    description: 'You should try and read through these issues and fix them if necessary.',
  },
  {
    id: LINTER_LEVELS.INFO,
    label: 'Info ',
    description: 'You should read through these suggestions and consider implementing them.',
  },
]

const ProjectLints: NextPageWithLayout = () => {
  const project = useSelectedProject()
  const router = useRouter()
  const { ref } = useParams()
  const gridRef = useRef<DataGridHandle>(null)
  const { preset } = useParams()

  // need to maintain a list of filters for each tab
  const [filters, setFilters] = useState([
    { level: LINTER_LEVELS.ERROR, filters: [] },
    { level: LINTER_LEVELS.WARN, filters: [] },
    { level: LINTER_LEVELS.INFO, filters: [] },
  ])

  const [currentTab, setCurrentTab] = useState<LINTER_LEVELS>(
    (preset as LINTER_LEVELS) ?? LINTER_LEVELS.ERROR
  )
  const [selectedRow, setSelectedRow] = useState<number>()
  const [selectedLint, setSelectedLint] = useState<Lint | null>(null)
  const [view, setView] = useState<'details' | 'suggestion'>('details')

  const { data, isLoading, isRefetching, refetch } = useProjectLintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const activeLints = data || []

  const currentTabFilters = (filters.find((filter) => filter.level === currentTab)?.filters ||
    []) as string[]

  const filteredLints = activeLints
    .filter((x) => x.level === currentTab)
    .filter((x) => (currentTabFilters.length > 0 ? currentTabFilters.includes(x.name) : x))

  const warnLintsCount = activeLints.filter((x) => x.level === 'WARN').length
  const errorLintsCount = activeLints.filter((x) => x.level === 'ERROR').length
  const infoLintsCount = activeLints.filter((x) => x.level === 'INFO').length

  const filterOptions = lintInfoMap
    // only show filters for lint types which are present in the results and not ignored
    .filter((item) =>
      activeLints.some((lint) => lint.name === item.name && lint.level === currentTab)
    )
    .map((type) => ({
      name: type.title,
      value: type.name,
    }))

  const updateFilters = (level: any, newFilters: any) => {
    // Create a copy of the current filters state
    const updatedFilters = [...filters]
    // Find the index of the filter object corresponding to the provided level
    const index = updatedFilters.findIndex((filter) => filter.level === level)
    if (index !== -1) {
      // Update the filters array at the found index with the new filters
      updatedFilters[index] = { ...updatedFilters[index], filters: newFilters }
      // Update the filters state with the updated array
      setFilters(updatedFilters)
    }
  }

  const lintCountLabel = (count: number, label: string) => (
    <>
      {isLoading ? (
        <ShimmeringLoader className="w-20 pt-1" />
      ) : (
        <>
          {count} {label}
        </>
      )}
    </>
  )

  const lintCols = [
    {
      id: 'name',
      name: 'Issue type',
      description: undefined,
      minWidth: 240,
      value: (row: any) => (
        <div className="flex items-center gap-1.5">
          <span className="shrink-0">
            {lintInfoMap.find((item) => row.name === item.name)?.icon}
          </span>
          {<h3 className="text-xs">{lintInfoMap.find((item) => row.name === item.name)?.title}</h3>}
        </div>
      ),
    },
    {
      id: 'metadata.name',
      name: 'Entity/item',
      description: undefined,
      minWidth: 230,
      value: (row: any) => (
        <div className="flex items-center gap-1 text-xs">
          <span className="shrink-0">{entityTypeIcon(row.metadata?.type)}</span>
          {`${row.metadata.schema}.${row.metadata.name}`}
        </div>
      ),
    },
    {
      id: 'description',
      name: 'Description',
      description: undefined,
      minWidth: 400,
      value: (row: any) => <ReactMarkdown className="text-xs">{row.description}</ReactMarkdown>,
    },
  ]

  const columns = lintCols.map((col) => {
    const result: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: true,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'first:pl-6 cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div className="flex items-center justify-between font-mono font-normal text-xs w-full">
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">{col.name}</p>
              {col.description && <p className="text-foreground-lighter">{col.description}</p>}
            </div>
          </div>
        )
      },
      renderCell: (props) => {
        const value = col.value(props.row)

        return (
          <div
            className={cn(
              'w-full flex flex-col justify-center font-mono text-xs',
              typeof value === 'number' ? 'text-right' : ''
            )}
          >
            <span>{value}</span>
          </div>
        )
      },
    }
    return result
  })

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Suggestions"
        docsUrl="https://supabase.github.io/splinter/"
      />
      <Tabs_Shadcn_
        defaultValue={currentTab}
        onValueChange={(value) => {
          setCurrentTab(value as LINTER_LEVELS)
          setSelectedLint(null)
          setSelectedRow(undefined)
          const { sort, search, ...rest } = router.query
          router.push({ ...router, query: { ...rest, preset: value } })
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
              <span className="text-xs text-foreground-muted group-hover:text-foreground-lighter group-data-[state=active]:text-foreground-lighter transition">
                {tab.id === LINTER_LEVELS.ERROR && lintCountLabel(errorLintsCount, 'errors')}
                {tab.id === LINTER_LEVELS.WARN && lintCountLabel(warnLintsCount, 'warnings')}
                {tab.id === LINTER_LEVELS.INFO && lintCountLabel(infoLintsCount, 'suggestions')}
              </span>
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>

      <div className="bg-surface-200 p-2 px-6 py-2 border-t -mt-px">
        {LINT_TABS.map((tab) => (
          <div key={tab.id} className={tab.id === currentTab ? '' : 'hidden'}>
            <FilterPopover
              name="Filter"
              options={filterOptions}
              labelKey="name"
              valueKey="value"
              activeOptions={filters.find((filter) => filter.level === currentTab)?.filters || []}
              onSaveFilters={(values) => updateFilters(currentTab, values)}
            />
          </div>
        ))}
      </div>
      <div className="col-span-12 flex items-center justify-between">
        <div className="flex items-center gap-x-4"></div>
      </div>
      <LoadingLine loading={isRefetching} />
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
        autoSaveId="linter-layout-v1"
      >
        <ResizablePanel defaultSize={1}>
          <DataGrid
            ref={gridRef}
            style={{ height: '100%' }}
            className={cn('flex-1 flex-grow h-full')}
            rowHeight={44}
            headerRowHeight={36}
            columns={columns}
            rows={filteredLints ?? []}
            rowClass={(_, idx) => {
              const isSelected = idx === selectedRow
              return [
                `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
                '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                '[&>.rdg-cell:first-child>div]:ml-4',
              ].join(' ')
            }}
            renderers={{
              renderRow(idx, props) {
                return (
                  <Row
                    {...props}
                    onClick={() => {
                      if (typeof idx === 'number' && idx >= 0) {
                        setSelectedRow(idx)
                        setSelectedLint(props.row)
                        gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                      }
                    }}
                  />
                )
              },
              noRowsFallback: isLoading ? (
                <div className="absolute top-14 px-6 w-full">
                  <GenericSkeletonLoader />
                </div>
              ) : (
                <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                  <TextSearch className="text-foreground-muted" strokeWidth={1} />
                  <div className="text-center">
                    <p className="text-foreground">No issues detected</p>
                    <p className="text-foreground-light">
                      Congrats! There are no suggestions available for this database
                    </p>
                  </div>
                </div>
              ),
            }}
          />
        </ResizablePanel>
        {selectedLint !== null && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={30}
              maxSize={45}
              minSize={30}
              className="bg-studio border-t"
            >
              <Button
                type="text"
                className="absolute top-3 right-3 px-1"
                icon={<X size={14} />}
                onClick={() => {
                  setSelectedLint(null)
                  setSelectedRow(undefined)
                }}
              />
              <Tabs_Shadcn_
                value={view}
                className="flex flex-col h-full"
                onValueChange={(value: any) => {
                  setView(value)
                }}
              >
                <TabsList_Shadcn_ className="px-5 flex gap-x-4 min-h-[46px]">
                  <TabsTrigger_Shadcn_
                    value="details"
                    className="px-0 pb-0 h-full text-xs  data-[state=active]:bg-transparent !shadow-none"
                  >
                    Overview
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_
                  value="details"
                  className="mt-0 flex-grow min-h-0 overflow-y-auto prose"
                >
                  {selectedLint && (
                    <div className={cn('py-4 px-5')}>
                      <h3 className="text-sm">
                        {lintInfoMap.find((item) => item.name === selectedLint.name)?.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Entity</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-200 border rounded-lg ">
                          {selectedLint.metadata?.type === 'table' && (
                            <Table2 className="text-foreground-muted" size={15} strokeWidth={1} />
                          )}
                          {selectedLint.metadata?.type === 'view' && (
                            <Eye className="text-foreground-muted" size={15} strokeWidth={1.5} />
                          )}{' '}
                          {`${selectedLint.metadata?.schema}.${selectedLint.metadata?.name}`}
                        </div>
                      </div>

                      <div className="grid">
                        <div>
                          <h3 className="text-sm">Issue</h3>
                          <ReactMarkdown className="leading-6 text-sm">
                            {selectedLint.detail}
                          </ReactMarkdown>
                        </div>
                        <div>
                          <h3 className="text-sm">Description</h3>
                          <ReactMarkdown className="text-sm">
                            {selectedLint.description}
                          </ReactMarkdown>
                        </div>

                        <div className="grid gap-2">
                          <h3 className="text-sm">Resolve</h3>
                          <div>
                            <LintCTA
                              title={selectedLint.name}
                              projectRef={ref!}
                              metadata={selectedLint.metadata}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <div className="px-6 py-6 flex gap-x-4 border-t ">
        <div className="w-[35%] flex flex-col gap-y-1 text-sm">
          <p>Reset suggestions</p>
          <p className="text-xs text-foreground-light">
            Consider resetting the analysis making any changes
          </p>

          <Button
            type="default"
            className="!mt-3 w-min"
            disabled={isLoading || isRefetching}
            loading={isLoading || isRefetching}
            onClick={() => refetch()}
          >
            Rerun linter
          </Button>
        </div>
        <div className="w-[35%] flex flex-col gap-y-1 text-sm">
          <p>How are these suggestions generated?</p>
          <Markdown
            className="text-xs"
            content="These suggestions use [splinter (Supabase Postgres LINTER)](https://github.com/supabase/splinter)."
          />
        </div>
      </div>
    </div>
  )
}

ProjectLints.getLayout = (page) => <DatabaseLayout title="Linter">{page}</DatabaseLayout>

export default ProjectLints
