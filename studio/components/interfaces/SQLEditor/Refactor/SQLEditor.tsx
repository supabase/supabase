import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import * as Tooltip from '@radix-ui/react-tooltip'
import DataGrid from '@supabase/react-data-grid'
import {
  Button,
  Dropdown,
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconHeart,
  IconLoader,
  IconRefreshCcw,
  Typography,
} from '@supabase/ui'
import { contentKeys } from 'data/content/keys'
import { Content, ContentData } from 'data/content/useContentQuery'
import { useProjectContext } from 'data/projects/ProjectContext'
import { useExecuteQueryMutation } from 'data/sql/useExecuteQueryMutation'
import { useKeyboardShortcuts, usePrevious, useStore, useWindowDimensions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { copyToClipboard, timeout } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { compact } from 'lodash'
import MarkdownTable from 'markdown-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CSVLink } from 'react-csv'
import { useQueryClient } from 'react-query'
import Split from 'react-split'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'

type SQLEditorProps = {
  id: string | undefined
  isLoading: boolean
}

const SQLEditor = ({ id, isLoading }: SQLEditorProps) => {
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const snippet = id ? snap.snippets[id] : null
  const { height: screenHeight } = useWindowDimensions()
  const snapOffset = 50
  const minSize = 44
  const tabMenuHeight = 44
  const offset = 3

  // useEffect(() => {
  //   // minus fixed tabMenu height
  //   const utilityPanelHeight =
  //     ((screenHeight - tabMenuHeight) * sqlEditorStore.activeTab.splitSizes[1]) / 100
  //   if (utilityPanelHeight - snapOffset < minSize) {
  //     sqlEditorStore.activeTab.resizeUtilityTab(0)
  //   } else {
  //     sqlEditorStore.activeTab.resizeUtilityTab(utilityPanelHeight - minSize - offset)
  //   }
  // }, [screenHeight, sqlEditorStore.activeTab.splitSizes])

  const idRef = useRef(id)
  idRef.current = id

  // we need to use the ref here because react-split doesn't respect
  // the updated onDragEnd function
  const onDragEnd = useCallback((sizes: number[]) => {
    const id = idRef.current

    if (id) {
      snap.setSplitSizes(id, sizes)
    }
  }, [])

  const { isLoading: isExecuting, mutate: execute } = useExecuteQueryMutation({
    onSuccess(data) {
      if (id) {
        snap.addResult(id, data.result)
      }
    },
    onError(error) {
      if (id) {
        snap.addResultError(id, error)
      }
    },
  })
  const executeQuery = useCallback(
    (overrideSql?: string) => {
      // use the latest state
      const state = getSqlEditorStateSnapshot()
      const snippet = id && state.snippets[id]

      if (project && snippet && !isExecuting) {
        execute?.({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql: overrideSql ?? snippet.snippet.content.sql,
        })
      }
    },
    [isExecuting, project]
  )

  return (
    <div className="flex h-full flex-col">
      <Split
        style={{ height: '100%' }}
        direction="vertical"
        gutterSize={2}
        sizes={(snippet?.splitSizes as number[] | undefined) ?? [50, 50]}
        minSize={minSize}
        snapOffset={snapOffset}
        expandToMin={true}
        collapsed={snippet?.utilityPanelCollapsed ? 1 : undefined}
        onDragEnd={onDragEnd}
      >
        <div className="dark:border-dark flex-grow overflow-y-auto border-b">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <MonacoEditor id={id!} executeQuery={executeQuery} />
          )}
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <UtilityPanel id={id!} isExecuting={isExecuting} executeQuery={executeQuery} />
          )}
        </div>
      </Split>
    </div>
  )
}
export default SQLEditor

type MonacoEditorProps = {
  id: string
  executeQuery?: (overrideSql?: string) => void
}

const MonacoEditor = ({ id, executeQuery }: MonacoEditorProps) => {
  const snap = useSqlEditorStateSnapshot({ sync: true })
  const snippet = snap.snippets[id]

  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    monacoRef.current.editor.setModelMarkers(model, 'owner', [])
  }, [])

  useEffect(() => {
    if (editorRef.current) {
      // add margin above first line
      editorRef.current?.changeViewZones((accessor: any) => {
        accessor.addZone({
          afterLineNumber: 0,
          heightInPx: 4,
          domNode: document.createElement('div'),
        })
      })
    }
  }, [])

  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const handleEditorOnMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.addAction({
      id: 'supabase',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        const selectedValue = (editorRef?.current)
          .getModel()
          .getValueInRange(editorRef?.current?.getSelection())

        executeQueryRef.current?.(selectedValue || undefined)
      },
    })

    // add margin above first line
    editor.changeViewZones((accessor) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    // when editor did mount, it will need a delay before focus() works properly
    await timeout(500)
    editor.focus()
  }

  // changes are stored in debouncer before running persistData()
  // let debounceUpdateSqlSnippet = debounce((value) => updateSqlSnippet(value), 1500)

  function handleEditorChange(value: string | undefined) {
    // update sqlEditorState with new value immediately
    // this is so any SQL run will be whatever is currently in monaco editor
    if (id && value) {
      snap.setSql(id, value)
    }
  }

  return (
    <Editor
      className="monaco-editor"
      theme={'supabase'}
      onMount={handleEditorOnMount}
      onChange={handleEditorChange}
      defaultLanguage="pgsql"
      defaultValue={snippet?.snippet.content.sql}
      path={id}
      options={{
        tabSize: 2,
        fontSize: 13,
        minimap: {
          enabled: false,
        },
        wordWrap: 'on',
        fixedOverflowWidgets: true,
      }}
    />
  )
}

type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  executeQuery?: (overrideSql?: string) => void
}

const UtilityPanel = ({ id, isExecuting, executeQuery }: UtilityPanelProps) => {
  return (
    <>
      <div className="flex justify-between overflow-visible px-6 py-2">
        <ResultsDropdown id={id} />

        <div className="inline-flex items-center justify-end">
          <UtilityActions id={id} isExecuting={isExecuting} executeQuery={executeQuery} />
        </div>
      </div>

      <div className="flex-1 p-0 pt-0 pb-0">
        <UtilityTabResults id={id} isExecuting={isExecuting} />
      </div>
    </>
  )
}

type ResultsDropdownProps = {
  id: string
}

const ResultsDropdown = ({ id }: ResultsDropdownProps) => {
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const result = snap.results[id][0]
  const { ui } = useStore()
  const csvRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null)

  const csvData = useMemo(
    () => (result?.rows ? compact(Array.from(result.rows || [])) : ''),
    [result?.rows]
  )

  function onDownloadCSV() {
    csvRef.current?.link.click()
    Telemetry.sendEvent('sql_editor', 'sql_download_csv', '')
  }

  function onCopyAsMarkdown() {
    if (navigator) {
      if (!result || !result.rows) return 'results is empty'
      if (result.rows.constructor !== Array && !!result.error) return result.error
      if (result.rows.length == 0) return 'results is empty'

      const columns = Object.keys(result.rows[0])
      const rows = result.rows.map((x) => {
        let temp: any[] = []
        columns.forEach((col) => temp.push(x[col]))
        return temp
      })
      const table = [columns].concat(rows)
      const markdownData = MarkdownTable(table)

      copyToClipboard(markdownData, () => {
        ui.setNotification({ category: 'success', message: 'Copied results to clipboard' })
        Telemetry.sendEvent('sql_editor', 'sql_copy_as_markdown', '')
      })
    }
  }

  return (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
          <Dropdown.Item onClick={onDownloadCSV}>Download CSV</Dropdown.Item>
          <Dropdown.Item onClick={onCopyAsMarkdown}>Copy as markdown</Dropdown.Item>
        </>
      }
    >
      <Button as="span" type="text" iconRight={<IconChevronDown />}>
        Results
      </Button>
      <CSVLink
        ref={csvRef}
        className="hidden"
        data={csvData}
        filename={`supabase_${project?.ref}_${snap.snippets[id]?.snippet.name}`}
      />
    </Dropdown>
  )
}

type SavingIndicatorProps = { id: string }

const SavingIndicator = ({ id }: SavingIndicatorProps) => {
  const snap = useSqlEditorStateSnapshot()
  const savingState = snap.savingStates[id]

  const previousState = usePrevious(savingState)
  const [showSavedText, setShowSavedText] = useState(false)

  useEffect(() => {
    let cancel = false

    if (previousState === 'UPDATING' && savingState === 'IDLE') {
      setShowSavedText(true)
      setTimeout(() => {
        if (!cancel) setShowSavedText(false)
      }, 3000)
    }

    return () => {
      cancel = true
    }
  }, [savingState])

  const retry = () => {
    snap.addNeedsSaving(id)
  }

  return (
    <div className="mx-2 flex items-center gap-2">
      {savingState === 'UPDATING_FAILED' && (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          icon={<IconRefreshCcw className="text-gray-1100" size="tiny" strokeWidth={2} />}
          onClick={retry}
        >
          Retry
        </Button>
      )}
      {savingState === 'UPDATING' && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconLoader className="animate-spin" size={14} strokeWidth={2} />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                'border-scale-200 border',
              ].join(' ')}
            >
              <span className="text-scale-1200 text-xs">Saving changes...</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      )}
      {savingState === 'UPDATING_FAILED' && (
        <IconAlertCircle className="text-red-900" size={14} strokeWidth={2} />
      )}
      {showSavedText && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconCheck className="text-brand-800" size={14} strokeWidth={3} />
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                'border-scale-200 border ',
              ].join(' ')}
            >
              <span className="text-scale-1200 text-xs">All changes saved</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      )}
      <span className="text-scale-1000 text-sm">
        {savingState === 'UPDATING_FAILED' && 'Failed to save'}
      </span>
    </div>
  )
}

type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  executeQuery?: (overrideSql?: string) => void
}

const UtilityActions = ({ id, isExecuting = false, executeQuery }: UtilityActionsProps) => {
  return (
    <>
      <SavingIndicator id={id} />
      {IS_PLATFORM && <FavoriteButton id={id} />}
      <SizeToggleButton id={id} />
      <Button
        onClick={() => executeQuery?.()}
        disabled={isExecuting}
        loading={isExecuting}
        type="text"
        size="tiny"
        shadow={false}
        className="mx-2"
      >
        RUN
      </Button>
    </>
  )
}

const SizeToggleButton = ({ id }: { id: string }) => {
  const snap = useSqlEditorStateSnapshot()
  const snippet = snap.snippets[id]

  function maximizeEditor() {
    snap.collapseUtilityPanel(id)
  }

  function restorePanelSize() {
    snap.restoreUtilityPanel(id)
  }

  return snippet.utilityPanelCollapsed ? (
    <Button
      type="text"
      size="tiny"
      shadow={false}
      onClick={restorePanelSize}
      icon={<IconChevronUp className="text-gray-1100" size="tiny" strokeWidth={2} />}
      // @ts-ignore
      tooltip={{
        title: 'Restore panel size',
        position: 'top',
      }}
    />
  ) : (
    <Button
      type="text"
      size="tiny"
      shadow={false}
      onClick={maximizeEditor}
      icon={<IconChevronDown className="text-gray-1100" size="tiny" strokeWidth={2} />}
      // @ts-ignore
      tooltip={{
        title: 'Maximize editor',
        position: 'top',
      }}
    />
  )
}

type FavoriteButtonProps = { id: string }

const FavoriteButton = ({ id }: FavoriteButtonProps) => {
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const isFavorite = snap.snippets[id].snippet.content.favorite
  const client = useQueryClient()

  async function addFavorite() {
    snap.addFavorite(id)

    client.setQueryData<ContentData>(
      contentKeys.list(project?.ref),
      (oldData: ContentData | undefined) => {
        if (!oldData) {
          return
        }

        return {
          ...oldData,
          content: oldData.content.map((content: Content) => {
            if (content.type === 'sql' && content.id === id) {
              return {
                ...content,
                content: {
                  ...content.content,
                  favorite: true,
                },
              }
            }

            return content
          }),
        }
      }
    )
  }

  async function removeFavorite() {
    snap.removeFavorite(id)

    client.setQueryData<ContentData>(
      contentKeys.list(project?.ref),
      (oldData: ContentData | undefined) => {
        if (!oldData) {
          return
        }

        return {
          ...oldData,
          content: oldData.content.map((content: Content) => {
            if (content.type === 'sql' && content.id === id) {
              return {
                ...content,
                content: {
                  ...content.content,
                  favorite: false,
                },
              }
            }

            return content
          }),
        }
      }
    )
  }

  return (
    <>
      {isFavorite ? (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={removeFavorite}
          icon={<IconHeart size="tiny" fill="#48bb78" />}
        />
      ) : (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={addFavorite}
          icon={<IconHeart size="tiny" fill="gray" />}
        />
      )}
    </>
  )
}

type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
}

const UtilityTabResults = ({ id, isExecuting }: UtilityTabResultsProps) => {
  const snap = useSqlEditorStateSnapshot()
  const utilityPanelCollapsed = snap.snippets[id].utilityPanelCollapsed
  const result = snap.results[id][0]

  if (utilityPanelCollapsed) return null
  if (isExecuting) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (result?.error) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <Typography.Text>
          <p className="m-0 border-0 px-6 py-4 font-mono">{result.error.message ?? result.error}</p>
        </Typography.Text>
      </div>
    )
  } else if (!result) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <Typography.Text type="secondary">
          <p className="m-0 border-0 px-6 py-4 ">
            Click <Typography.Text code>RUN</Typography.Text> to execute your query.
          </p>
        </Typography.Text>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Results rows={result.rows} />
    </div>
  )
}

const Results = ({ rows }: { rows: readonly any[] }) => {
  const [cellPosition, setCellPosition] = useState<any>(undefined)

  useKeyboardShortcuts(
    {
      'Command+c': (event: any) => {
        event.stopPropagation()
        onCopyCell()
      },
      'Control+c': (event: any) => {
        event.stopPropagation()
        onCopyCell()
      },
    },
    ['INPUT', 'TEXTAREA'] as any
  )

  if (rows.length <= 0) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
      </div>
    )
  }

  const formatter = (column: any, row: any) => {
    return <span className="font-mono text-xs">{JSON.stringify(row[column])}</span>
  }
  const columnRender = (name: string) => {
    return <div className="flex h-full items-center justify-center font-mono">{name}</div>
  }
  const columns = Object.keys(rows[0]).map((key) => ({
    key,
    name: key,
    formatter: ({ row }: any) => formatter(key, row),
    headerRenderer: () => columnRender(key),
    resizable: true,
    width: 120,
  }))

  function onSelectedCellChange(position: any) {
    setCellPosition(position)
  }

  function onCopyCell() {
    if (columns && cellPosition) {
      const { idx, rowIdx } = cellPosition
      const colKey = columns[idx].key
      const cellValue = rows[rowIdx]?.[colKey] ?? ''
      const value = formatClipboardValue(cellValue)
      copyToClipboard(value)
    }
  }

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      style={{ height: '100%' }}
      onSelectedCellChange={onSelectedCellChange}
    />
  )
}

function formatClipboardValue(value: any) {
  if (value === null) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return value
}
