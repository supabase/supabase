import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import {
  LintCategoryBadge,
  LintEntity,
  lintInfoMap,
  NoIssuesFound,
} from 'components/interfaces/Linter/Linter.utils'
import { Lint } from 'data/lint/lint-query'
import { useTrack } from 'lib/telemetry/track'
import { X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useRef } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import ReactMarkdown from 'react-markdown'
import { Button, cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import LintDetail from './LintDetail'
import { EntityTypeIcon } from './Linter.utils'

interface LinterDataGridProps {
  isLoading: boolean
  filteredLints: Lint[]
  selectedLint: Lint | null
  currentTab: LINTER_LEVELS
}

const LinterDataGrid = ({
  isLoading,
  filteredLints,
  selectedLint,
  currentTab,
}: LinterDataGridProps) => {
  const gridRef = useRef<DataGridHandle>(null)
  const { ref } = useParams()
  const router = useRouter()
  const track = useTrack()

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
    const { id, ...otherParams } = router.query
    router.push({ query: otherParams })
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="relative flex flex-grow bg-alternative min-h-0"
      autoSaveId="linter-layout-v1"
    >
      <ResizablePanel>
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
                      gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                      const { id, ...rest } = router.query
                      router.push({ ...router, query: { ...rest, id: props.row.cache_key } })

                      track('advisor_detail_opened', {
                        origin: 'advisors_page',
                        advisorSource: 'lint',
                        advisorCategory: props.row.categories[0],
                        advisorType: props.row.name,
                        advisorLevel: props.row.level,
                      })
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
          <ResizablePanel
            defaultSize="30"
            maxSize="45"
            minSize="30"
            className="bg-studio border-t flex flex-col h-full"
          >
            <div className="flex items-center justify-between w-full border-b py-3 px-6">
              <div className="flex items-center gap-2">
                <h3 className="text-sm m-0">
                  {lintInfoMap.find((item) => item.name === selectedLint.name)?.title ?? 'Unknown'}
                </h3>
                <LintCategoryBadge category={selectedLint.categories[0]} />
              </div>
              <Button type="text" icon={<X />} onClick={handleSidepanelClose} />
            </div>
            <div className="p-6 flex-grow min-h-0 overflow-y-auto">
              <LintDetail lint={selectedLint} projectRef={ref!} />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

export default LinterDataGrid
