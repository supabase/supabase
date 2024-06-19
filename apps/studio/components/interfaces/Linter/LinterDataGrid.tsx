import { ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import ReactMarkdown from 'react-markdown'

import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { LintEntity, NoIssuesFound, lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { Lint } from 'data/lint/lint-query'
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { EntityTypeIcon, LintCTA, LintCategoryBadge } from './Linter.utils'
import { useRouter } from 'next/router'

interface LinterDataGridProps {
  isLoading: boolean
  filteredLints: Lint[]
  selectedLint: Lint | null
  setSelectedLint: (value: Lint | null) => void
  currentTab: LINTER_LEVELS
}

const LinterDataGrid = ({
  isLoading,
  filteredLints,
  selectedLint,
  setSelectedLint,
  currentTab,
}: LinterDataGridProps) => {
  const gridRef = useRef<DataGridHandle>(null)
  const { ref } = useParams()
  const router = useRouter()

  const [view, setView] = useState<'details' | 'suggestion'>('details')

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
          <span className="shrink-0">
            <EntityTypeIcon type={row.metadata?.type} />
          </span>
          <LintEntity metadata={row.metadata} />
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

  function handleSidepanelClose() {
    setSelectedLint(null)
    const { id, ...otherParams } = router.query
    router.push({ query: otherParams })
  }

  return (
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
          rowClass={(lint) => {
            const isSelected = lint.cache_key === selectedLint?.cache_key
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
                  key={props.row.cache_key}
                  {...props}
                  onClick={() => {
                    if (typeof idx === 'number' && idx >= 0) {
                      setSelectedLint(props.row)
                      gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                      const { id, ...rest } = router.query
                      router.push({ ...router, query: { ...rest, id: props.row.cache_key } })
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
              <NoIssuesFound level={currentTab} />
            ),
          }}
        />
      </ResizablePanel>
      {selectedLint !== null && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} maxSize={45} minSize={30} className="bg-studio border-t">
            <Button
              type="text"
              className="absolute top-3 right-3 px-1"
              icon={<X size={14} />}
              onClick={handleSidepanelClose}
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
                  <div className="py-4 px-5">
                    <div className="flex items-center gap-2 py-2">
                      <h3 className="text-sm m-0">
                        {lintInfoMap.find((item) => item.name === selectedLint.name)?.title}
                      </h3>
                      <LintCategoryBadge category={selectedLint.categories[0]} />
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-4">
                      <span>Entity</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-200 border rounded-lg ">
                        <EntityTypeIcon type={selectedLint.metadata?.type} />
                        <LintEntity metadata={selectedLint.metadata} />
                      </div>
                    </div>

                    <div className="grid">
                      <div>
                        <h3 className="text-sm">Issue</h3>
                        <ReactMarkdown className="leading-6 text-sm">
                          {selectedLint.detail.replace(/\\`/g, '`')}
                        </ReactMarkdown>
                      </div>
                      <div>
                        <h3 className="text-sm">Description</h3>
                        <ReactMarkdown className="text-sm">
                          {selectedLint.description.replace(/\\`/g, '`')}
                        </ReactMarkdown>
                      </div>

                      <div className="grid gap-2">
                        <h3 className="text-sm">Resolve</h3>
                        <div className="flex items-center gap-2">
                          <LintCTA
                            title={selectedLint.name}
                            projectRef={ref!}
                            metadata={selectedLint.metadata}
                          />
                          <Button asChild type="text">
                            <Link
                              href={
                                lintInfoMap.find((item) => item.name === selectedLint.name)
                                  ?.docsLink ||
                                'https://supabase.com/docs/guides/database/database-linter'
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="no-underline"
                            >
                              <span className="flex items-center gap-2">
                                Learn more <ExternalLink size={14} />
                              </span>
                            </Link>
                          </Button>
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
  )
}

export default LinterDataGrid
