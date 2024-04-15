import { Eye, MessageSquareMore, Table2, TextSearch, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { InformationCircleIcon } from '@heroicons/react/16/solid'
import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
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
  cn,
  LoadingLine,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { FilterPopover } from 'components/ui/FilterPopover'
import ReactMarkdown from 'react-markdown'
import { Markdown } from '../../../../components/interfaces/Markdown'
import { LintCTA } from '../../../../components/interfaces/Reports/ReportLints.utils'

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
    console.log('zans', 'newFilters', newFilters, 'filters', filters)
    setFilters((prevFilters) => {
      // Map over the previous filters array
      return prevFilters.map((filter) => {
        // If the filter level matches the desired level, update its filters
        if (filter.level === level) {
          return { ...filter, filters: newFilters }
        } else {
          // Otherwise, return the filter unchanged
          return filter
        }
      })
    })
  }

  const LINTER_TABS = [
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

  const lintCols = [
    {
      id: 'name',
      name: 'Issue type',
      description: undefined,
      minWidth: 200,
      value: (row: any) => (
        <div className="flex items-center gap-1.5">
          {lintInfoMap.find((item) => row.name === item.name)?.icon}
          {<h3 className="text-sm">{lintInfoMap.find((item) => row.name === item.name)?.title}</h3>}
        </div>
      ),
    },
    {
      id: 'metadata.name',
      name: 'Entity/item',
      description: undefined,
      minWidth: 230,
      value: (row: any) => (
        <div className="flex items-center gap-1">
          {row.metadata?.type === 'table' && <Table2 size={15} strokeWidth={1} />}
          {row.metadata?.type === 'view' && <Eye size={15} strokeWidth={1.5} />}{' '}
          {`${row.metadata.schema}.${row.metadata.name}`}
        </div>
      ),
    },
    {
      id: 'description',
      name: 'Description',
      description: undefined,
      minWidth: 400,
      value: (row: any) => row.description,
    },
  ]
  console.log(filteredLints)
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
    <div className="relative">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Suggestions"
        docsUrl="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
      />
      <Tabs_Shadcn_
        defaultValue={currentTab}
        onValueChange={(value) => {
          setCurrentTab(value as LINTER_LEVELS)
          setSelectedLint(null)
          const { sort, search, ...rest } = router.query
          router.push({ ...router, query: { ...rest, preset: value } })
        }}
      >
        <TabsList_Shadcn_ className={cn('flex gap-0 border-0 items-end z-10')}>
          {LINTER_TABS.map((tab) => (
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
                <MessageSquareMore
                  size={14}
                  fill={
                    tab.id === LINTER_LEVELS.ERROR
                      ? 'red'
                      : tab.id === LINTER_LEVELS.WARN
                        ? 'orange'
                        : 'green'
                  }
                  stroke="none"
                />

                <span className="">{tab.label}</span>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <InformationCircleIcon className="transition text-foreground-muted w-3 h-3 data-[state=delayed-open]:text-foreground-light" />
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="top">{tab.description}</TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              </div>

              <span className="text-xs text-foreground-muted group-hover:text-foreground-lighter group-data-[state=active]:text-foreground-lighter transition">
                {tab.id === LINTER_LEVELS.ERROR && `${errorLintsCount} errors`}
                {tab.id === LINTER_LEVELS.WARN && `${warnLintsCount} warnings`}
                {tab.id === LINTER_LEVELS.INFO && `${infoLintsCount} suggestions`}
              </span>

              {tab.id === currentTab && (
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-surface-200"></div>
              )}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>

      <div className="bg-surface-200 p-2">
        <FilterPopover
          name="Filter"
          options={filterOptions}
          labelKey="name"
          valueKey="value"
          activeOptions={filters.find((filter) => filter.level === currentTab)?.filters || []}
          onSaveFilters={(values) => {
            console.log('some values', values)
            updateFilters(currentTab, values)
          }}
        />
      </div>
      <div className="col-span-12 flex items-center justify-between">
        <div className="flex items-center gap-x-4"></div>
      </div>
      <LoadingLine loading={isLoading || isRefetching} />
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
        autoSaveId="query-performance-layout-v1"
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
                console.log({ props })
                return (
                  <Row
                    {...props}
                    onClick={() => {
                      if (typeof idx === 'number' && idx >= 0) {
                        setSelectedRow(idx)
                        setSelectedLint(props.row)
                        gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })

                        // const selectedLint = activeLints[idx]['query']
                        // if (!(selectedLint ?? '').trim().toLowerCase().startsWith('select')) {
                        //   setView('details')
                        // }
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
                    <p className="text-foreground">No queries detected</p>
                    <p className="text-foreground-light">
                      There are no actively running queries that match the criteria
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
                onClick={() => setSelectedLint(null)}
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
                  {/* {showIndexSuggestions && (
                        <TabsTrigger_Shadcn_
                          value="suggestion"
                          className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none"
                        >
                          Autofix
                        </TabsTrigger_Shadcn_>
                      )} */}
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_
                  value="details"
                  className="mt-0 flex-grow min-h-0 overflow-y-auto"
                >
                  {selectedLint && (
                    <div className={cn('py-4 px-4 grid gap-2')}>
                      {/* <h3 className="text-sm">{getHumanReadableTitle(selectedLint.name)}</h3> */}
                      <h3 className="text-sm">
                        {lintInfoMap.find((item) => item.name === selectedLint.name)?.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Entity</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-200 border rounded-lg ">
                          {selectedLint.metadata?.type === 'table' && (
                            <Table2 size={15} strokeWidth={1} />
                          )}
                          {selectedLint.metadata?.type === 'view' && (
                            <Eye size={15} strokeWidth={1.5} />
                          )}{' '}
                          {`${selectedLint.metadata?.schema}.${selectedLint.metadata?.name}`}
                        </div>
                      </div>

                      <div className="grid gap-6 mt-6 text-sm">
                        <div className="grid gap-2">
                          <h3>Issue</h3>
                          <ReactMarkdown className="leading-6">{selectedLint.detail}</ReactMarkdown>
                        </div>
                        <div className="grid gap-2">
                          <h3>Description</h3>
                          <ReactMarkdown className="text-sm">
                            {selectedLint.description}
                          </ReactMarkdown>
                        </div>

                        <div className="grid gap-2">
                          <h3>Resolve</h3>
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
      <div className="px-6 py-6 flex gap-x-4 border-t">
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
      <div className="col-span-12 hidden remove-me-when-finished">
        {/* <Table
          head={[
            <Table.th key="level" className="py-2">
              Level
            </Table.th>,
            <Table.th key="header-type" className="py-2">
              Problem
            </Table.th>,
            <Table.th key="header-expand" className="py-2 text-right"></Table.th>,
          ]}
          body={[
            <Table.tr key="loader">
              <Table.td colSpan={12} className="!p-0">
                <LoadingLine loading={isLoading || isRefetching} />
              </Table.td>
            </Table.tr>,
            ...(activeLints.length === 0
              ? [
                  <Table.tr key="empty-state">
                    <Table.td colSpan={6} className="p-3 py-12">
                      {isLoading ? (
                        <div className="flex items-center gap-x-2">
                          <Loader className="animate-spin" size={12} />
                          <p className="text-foreground-light">Checking database for issues...</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-x-2">
                          <Check size={12} />
                          <p className="text-foreground-light">
                            No issues have been found for this database
                          </p>
                        </div>
                      )}
                    </Table.td>
                  </Table.tr>,
                ]
              // : (filters.levels.length > 0 || filters.types.length > 0) &&
              //     filteredLints.length === 0
              //   ? [
              //       <Table.tr key="empty-state">
              //         <Table.td colSpan={6} className="p-3 py-12">
              //           <p className="text-foreground-light">
              //             No problems found based on the selected filters
              //           </p>
              //         </Table.td>
              //       </Table.tr>,
              //     ]
              //   : filteredLints.map((lint) => {
              //       return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
              //     })),
          ]}
        /> */}
      </div>
    </div>
  )
}

ProjectLints.getLayout = (page) => <DatabaseLayout title="Linter">{page}</DatabaseLayout>

export default ProjectLints
