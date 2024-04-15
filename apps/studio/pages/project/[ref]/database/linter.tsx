import { sortBy } from 'lodash'
import {
  Check,
  ExternalLink,
  Loader,
  MessageSquareMore,
  ArrowDown,
  ArrowUp,
  TextSearch,
  X,
  IceCream,
  Table2,
  Eye,
} from 'lucide-react'
import { useMemo, useState, useRef } from 'react'

import { getHumanReadableTitle } from 'components/interfaces/Reports/ReportLints.utils'
import ReportLintsTableRow from 'components/interfaces/Reports/ReportLintsTableRow'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms'
import { LINT_TYPES, Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  LoadingLine,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  TabsContent_Shadcn_,
} from 'ui'
import { InformationCircleIcon } from '@heroicons/react/16/solid'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import {
  QUERY_PERFORMANCE_REPORT_TYPES,
  QUERY_PERFORMANCE_REPORTS,
} from '../../../../components/interfaces/QueryPerformanceV2/QueryPerformance.constants'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { Column, Row, DataGridHandle } from 'react-data-grid'
import DataGrid from 'react-data-grid'
import { GenericSkeletonLoader } from 'ui-patterns'
import { QueryDetail } from '../../../../components/interfaces/QueryPerformanceV2/QueryDetail'
import { QueryIndexes } from '../../../../components/interfaces/QueryPerformanceV2/QueryIndexes'
import { getLintIcon, LintCTA } from '../../../../components/interfaces/Reports/ReportLints.utils'
import { Markdown } from '../../../../components/interfaces/Markdown'
import ReactMarkdown from 'react-markdown'

const ProjectLints: NextPageWithLayout = () => {
  const project = useSelectedProject()
  const router = useRouter()
  const { ref } = useParams()
  const gridRef = useRef<DataGridHandle>(null)
  const { preset } = useParams()
  const [filters, setFilters] = useState({
    levels: [] as string[],
    types: [] as string[],
  })

  const [page, setPage] = useState<LINTER_LEVELS>((preset as LINTER_LEVELS) ?? LINTER_LEVELS.ERROR)
  const [selectedRow, setSelectedRow] = useState<number>()
  const [selectedLint, setSelectedLint] = useState<Lint | null>(null)
  const [view, setView] = useState<'details' | 'suggestion'>('details')
  // const [lintIgnoreList] = useLocalStorageQuery<string[]>(
  //   LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST,
  //   []
  // )

  const { data, isLoading, isRefetching, refetch } = useProjectLintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // sort the lints by level, ERROR should be at the top.
  const lints = sortBy(data || [], (lint) => {
    if (lint.level === 'ERROR') return 0
    if (lint.level === 'WARN') return 1
    if (lint.level === 'INFO') return 2
    return 3
  })

  const activeLints = lints
  // const [ignoredLints, activeLints] = partition(lints, (lint) =>
  //   lintIgnoreList.includes(lint.cache_key)
  // )
  // const filteredLints = useMemo(() => {
  //   return activeLints
  //     .filter((x) => (filters.levels.length > 0 ? filters.levels.includes(x.level) : x))
  //     .filter((x) => (filters.types.length > 0 ? filters.types.includes(x.name) : x))
  // }, [activeLints, filters.levels, filters.types])
  console.log({ activeLints })
  const filteredLints = activeLints.filter((x) => x.level === page)

  const warnLintsCount = activeLints.filter((x) => x.level === 'WARN').length
  const errorLintsCount = activeLints.filter((x) => x.level === 'ERROR').length
  const infoLintsCount = activeLints.filter((x) => x.level === 'INFO').length

  const filterOptions = useMemo(() => {
    // only show filters for lint types which are present in the results and not ignored
    return LINT_TYPES.filter((type) => activeLints.some((lint) => lint.name === type)).map(
      (type) => ({
        name: getHumanReadableTitle(type),
        value: type,
      })
    )
  }, [activeLints])

  const LINTER_TABS = [
    {
      id: LINTER_LEVELS.ERROR,
      label: 'Errors',
      description: 'Errors.....description',
    },
    {
      id: LINTER_LEVELS.WARN,
      label: 'Warnings ',
      description: 'warning description',
    },
    {
      id: LINTER_LEVELS.INFO,
      label: 'Info ',
      description: 'info description',
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
          {getLintIcon(row.name)} {getHumanReadableTitle(row.name)}
        </div>
      ),
    },
    {
      id: 'metadata.name',
      name: 'Entity/item',
      description: undefined,
      minWidth: 200,
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
        defaultValue={page}
        onValueChange={(value) => {
          setPage(value as LINTER_LEVELS)
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
                tab.id === page ? '!bg-surface-200' : '!bg-surface-200/[33%]',
                'hover:!bg-surface-100',
                'data-[state=active]:!bg-surface-200',
                'hover:text-foreground-light',
                'transition'
              )}
            >
              {tab.id === page && (
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

              {tab.id === page && (
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-surface-200"></div>
              )}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>
      {/* <div className="col-span-12">
            <FormHeader
              className="!mb-0"
              title="Database Linter"
              description="Identify common schema problems in your database."
            />
          </div> */}
      <div className="col-span-12 flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          {/* <div className="flex items-center gap-x-2">
                <p className="text-xs prose">Filter by</p>
                <FilterPopover
                  name="Level"
                  options={[
                    { name: 'Info', value: 'INFO' },
                    { name: 'Warning', value: 'WARN' },
                    { name: 'Error', value: 'ERROR' },
                  ]}
                  labelKey="name"
                  valueKey="value"
                  activeOptions={filters.levels}
                  onSaveFilters={(values) => setFilters({ ...filters, levels: values })}
                />
                <FilterPopover
                  name="Type"
                  options={filterOptions}
                  labelKey="name"
                  valueKey="value"
                  activeOptions={filters.types}
                  onSaveFilters={(values) => setFilters({ ...filters, types: values })}
                />
              </div> */}
          {/* <p className="text-foreground-light text-xs">
                Identified {activeLints.length} problems{' '}
                {warnLintsCount > 0 || errorLintsCount > 0
                  ? `(${errorLintsCount > 0 ? `${errorLintsCount} errors` : ''}${errorLintsCount > 0 && warnLintsCount > 0 ? ', ' : ''}${warnLintsCount > 0 ? `${warnLintsCount} warnings` : ''})`
                  : null}
              </p> */}
        </div>
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
                      <h3 className="text-sm">{getHumanReadableTitle(selectedLint.name)}</h3>
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
                          <ReactMarkdown className="">{selectedLint.detail}</ReactMarkdown>
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

                  {/* <QueryDetail
                    reportType={QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT}
                    selectedRow={activeLints[selectedRow]}
                    onClickViewSuggestion={() => setView('suggestion')}
                  /> */}
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_
                  value="suggestion"
                  className="mt-0 flex-grow min-h-0 overflow-y-auto"
                >
                  hello
                  {/* <QueryIndexes selectedRow={queryPerformanceQuery.data?.[selectedRow]} /> */}
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
      <div className="col-span-12 hidden">
        <Table
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
              : (filters.levels.length > 0 || filters.types.length > 0) &&
                  filteredLints.length === 0
                ? [
                    <Table.tr key="empty-state">
                      <Table.td colSpan={6} className="p-3 py-12">
                        <p className="text-foreground-light">
                          No problems found based on the selected filters
                        </p>
                      </Table.td>
                    </Table.tr>,
                  ]
                : filteredLints.map((lint) => {
                    return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                  })),
          ]}
        />
      </div>
      {/* {ignoredLints.length > 0 && (
          <div className="col-span-12 flex flex-col text-sm max-w-none gap-8 py-4">
            <Accordion_Shadcn_ type="single" collapsible>
              <AccordionItem_Shadcn_ value="1" className="border-none">
                <AccordionTrigger className="px-4 bg-surface-100 rounded border [&[data-state=open]]:rounded-b-none hover:no-underline">
                  <div className="text-sm text-foreground-light font-normal">
                    Ignored problems ({ignoredLints.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent_Shadcn_>
                  <Table
                    body={
                      (lints ?? []).length === 0 ? (
                        <Table.tr>
                          <Table.td colSpan={6} className="p-3 py-12 text-center">
                            <p className="text-foreground-light">
                              {isLoading ? (
                                <>
                                  <Loader className="animate-spin" size={12} />
                                  Checking for database issues
                                </>
                              ) : (
                                'No issues have been found for this database'
                              )}
                            </p>
                          </Table.td>
                        </Table.tr>
                      ) : (
                        <>
                          {ignoredLints.map((lint) => {
                            return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                          })}
                        </>
                      )
                    }
                  />
                </AccordionContent_Shadcn_>
              </AccordionItem_Shadcn_>
            </Accordion_Shadcn_>
          </div>
        )} */}
    </div>
  )
}

ProjectLints.getLayout = (page) => <DatabaseLayout title="Linter">{page}</DatabaseLayout>

export default ProjectLints
