import Split from 'react-split'
import Editor from '@monaco-editor/react'
import DataGrid from '@supabase/react-data-grid'
import classNames from 'classnames'
import { CSVLink } from 'react-csv'
import { debounce } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { Button, Dropdown, IconCheck, IconChevronDown, IconClipboard } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useKeyboardShortcuts, useStore, useWindowDimensions, checkPermissions } from 'hooks'
import Telemetry from 'lib/telemetry'
import { copyToClipboard, timeout } from 'lib/helpers'
import { useSqlStore, UTILITY_TAB_TYPES } from 'localStores/sqlEditor/SqlEditorStore'
import { SQL_SNIPPET_SCHEMA_VERSION } from './SqlEditor.constants'
import UtilityActions from 'components/interfaces/SQLEditor/TabSqlQuery/UtilityActions'

const TabSqlQuery = observer(() => {
  const sqlEditorStore = useSqlStore()
  const { ui, content: contentStore } = useStore()
  const { height: screenHeight } = useWindowDimensions()

  const snapOffset = 50
  const minSize = 44
  const tabMenuHeight = 44
  const offset = 3

  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: ui.profile?.id },
    subject: { id: ui.profile?.id },
  })

  useEffect(() => {
    // minus fixed tabMenu height
    const utilityPanelHeight =
      (parseFloat(screenHeight - tabMenuHeight) * sqlEditorStore.activeTab.splitSizes[1]) / 100
    if (utilityPanelHeight - snapOffset < minSize) {
      sqlEditorStore.activeTab.resizeUtilityTab(0)
    } else {
      sqlEditorStore.activeTab.resizeUtilityTab(utilityPanelHeight - minSize - offset)
    }
  }, [screenHeight, sqlEditorStore.activeTab.splitSizes])

  function onDragEnd(sizes) {
    sqlEditorStore.activeTab.setSplitSizes(sizes)
  }

  async function updateSqlSnippet(value) {
    if (!canCreateSQLSnippet) return

    if (sqlEditorStore.activeTab) {
      await contentStore.updateSql(sqlEditorStore.activeTab.id, {
        content: {
          schema_version: SQL_SNIPPET_SCHEMA_VERSION,
          content_id: sqlEditorStore.activeTab.id,
          sql: value,
          favorite: sqlEditorStore.activeTab.favorite,
        },
      })
    } else {
      console.warn('No active tab found while updating SQL snippet')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Split
        style={{ height: '100%' }}
        direction="vertical"
        gutterSize={2}
        sizes={sqlEditorStore.activeTab.splitSizes || []}
        minSize={minSize}
        snapOffset={snapOffset}
        expandToMin={true}
        collapsed={sqlEditorStore.activeTab.utilityTabHeight == 0 ? 1 : undefined}
        onDragEnd={onDragEnd}
      >
        <MonacoEditor
          error={sqlEditorStore.activeTab.sqlQueryError}
          updateSqlSnippet={updateSqlSnippet}
          setUpdatingRequired={contentStore.setUpdatingRequired.bind(contentStore)}
        />
        <div>
          <UtilityPanel updateSqlSnippet={updateSqlSnippet} />
        </div>
      </Split>
    </div>
  )
})
export default TabSqlQuery

const MonacoEditor = ({ error, updateSqlSnippet, setUpdatingRequired }) => {
  const sqlEditorStore = useSqlStore()
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    if (!error) {
      const model = editorRef.current.getModel()
      monacoRef.current.editor.setModelMarkers(model, 'owner', [])
    } else if (error?.cursorPosition) {
      const model = editorRef.current.getModel()
      const position = model.getPositionAt(error.cursorPosition)
      monacoRef.current.editor.setModelMarkers(model, 'owner', [
        {
          startLineNumber: position.lineNumber,
          endLineNumber: 1,
          startColumn: position.column,
          endColumn: 0,
          message: error.message || 'syntax error',
          severity: monacoRef.current.MarkerSeverity.Error,
        },
      ])
    }
  }, [error])

  useEffect(() => {
    if (editorRef.current) {
      // add margin above first line
      editorRef.current?.changeViewZones((accessor) => {
        accessor.addZone({
          afterLineNumber: 0,
          heightInPx: 4,
          domNode: document.createElement('div'),
        })
      })
    }
  }, [sqlEditorStore.activeTab.id])

  async function handleEditorOnMount(editor, monaco) {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.addAction({
      id: 'supabase',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: async () => {
        if (sqlEditorStore.isExecuting) return

        const selectedValue = (editorRef?.current)
          .getModel()
          .getValueInRange(editorRef?.current?.getSelection())

        await sqlEditorStore.startExecuting(selectedValue)

        // onInputRun(selectedValue || (editorRef?.current as any)?.getValue())
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
    editor?.focus()
  }

  // changes are stored in debouncer before running persistData()
  let debounceUpdateSqlSnippet = debounce((value) => updateSqlSnippet(value), 1500)

  async function handleEditorChange(value) {
    // update sqlEditorStore with new value immediately
    // this is so any SQL run will be whatever is currently in monaco editor
    sqlEditorStore.activeTab.setQuery(value)

    // inform the content store that the SQL has changed and needs to be persisted
    // this is so we can block the tab being closed if an update is required
    setUpdatingRequired?.()

    // debounce changes
    debounceUpdateSqlSnippet(value)
  }

  return (
    <div className="flex-grow overflow-y-auto border-b dark:border-dark">
      <Editor
        className="monaco-editor"
        theme={'supabase'}
        onMount={handleEditorOnMount}
        onChange={handleEditorChange}
        defaultLanguage="pgsql"
        defaultValue={sqlEditorStore.activeTab.query}
        path={sqlEditorStore.activeTab.id}
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
    </div>
  )
}

const UtilityPanel = observer(({ updateSqlSnippet }) => {
  const sqlEditorStore = useSqlStore()

  return (
    <>
      <div className="flex justify-between overflow-visible px-6 py-2">
        <ResultsDropdown />
        <div className="inline-flex items-center justify-end">
          <UtilityActions updateSqlSnippet={updateSqlSnippet} />
        </div>
      </div>
      <div className="p-0 pt-0 pb-0">
        {sqlEditorStore.activeTab.activeUtilityTab == UTILITY_TAB_TYPES.RESULTS && (
          <UtilityTabResults />
        )}
      </div>
    </>
  )
})

const ResultsDropdown = observer(() => {
  const { ui } = useStore()
  const sqlEditorStore = useSqlStore()
  const csvRef = useRef(null)

  function onDownloadCSV() {
    csvRef.current?.link.click()
    Telemetry.sendEvent('sql_editor', 'sql_download_csv', '')
  }

  function onCopyAsMarkdown() {
    if (navigator) {
      copyToClipboard(sqlEditorStore.activeTab.markdownData, () => {
        ui.setNotification({ category: 'success', message: 'Copied results to clipboard' })
        Telemetry.sendEvent('sql_editor', 'sql_copy_as_markdown', '')
      })
    }
  }

  const formatDataForCSV = (data = []) => {
    return data.map((row) => {
      const formattedRow = { ...row }
      Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'object') formattedRow[key] = JSON.stringify(row[key])
      })
      return formattedRow
    })
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
        data={formatDataForCSV(sqlEditorStore.activeTab?.csvData || '')}
        filename={`supabase_${sqlEditorStore.projectRef}_${sqlEditorStore.activeTab.name}`}
      />
    </Dropdown>
  )
})

const UtilityTabResults = observer(() => {
  const sqlEditorStore = useSqlStore()

  if (sqlEditorStore.activeTab.utilityTabHeight == 0) return null
  if (sqlEditorStore.activeTab.isExecuting) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (sqlEditorStore.activeTab.errorResult) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono">{sqlEditorStore.activeTab.errorResult}</p>
      </div>
    )
  } else if (sqlEditorStore.activeTab.hasNoResult) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 text-sm text-scale-1000">
          Click <code>RUN</code> or hit{' '}
          <code>{window.navigator.platform.match(/^Mac/) ? '⌘' : 'Ctrl'} + Enter</code> to execute
          your query.
        </p>
      </div>
    )
  }

  return (
    <div style={{ height: sqlEditorStore.activeTab.utilityTabHeight }}>
      <Results results={sqlEditorStore.activeTab.results} />
    </div>
  )
})

const Results = ({ results }) => {
  const [cellPosition, setCellPosition] = useState(undefined)
  const [copiedCell, setCopiedCell] = useState(undefined)

  useKeyboardShortcuts(
    {
      'Command+c': (event) => {
        event.stopPropagation()
        onCopySelectedCell()
      },
      'Control+c': (event) => {
        event.stopPropagation()
        onCopySelectedCell()
      },
    },
    ['INPUT', 'TEXTAREA']
  )

  useEffect(() => {
    let timeoutId = 0

    if (copiedCell) {
      timeoutId = setTimeout(() => {
        setCopiedCell(undefined)
      }, 1000)
    }

    return () => {
      // we need to clear previous timeout to prevent checkmark flickering
      // when clicking `Copy` button multiple times in a short time
      timeoutId && clearTimeout(timeoutId)
    }
  }, [copiedCell])

  if (results?.error) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-scale-1000">ERROR: {results.error}</p>
      </div>
    )
  }
  if (!results.length) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
      </div>
    )
  }

  const handleCopyClick = (column, row, rowIndex) => {
    copyToClipboard(formatClipboardValue(row[column]), () => {
      setCopiedCell(`${column},${rowIndex}`)
    })
  }

  const formatter = (column, row, rowIndex) => {
    const isCopied = copiedCell === `${column},${rowIndex}`

    return (
      <div className="group sb-grid-select-cell__formatter overflow-hidden">
        <span className="font-mono text-xs truncate">{JSON.stringify(row[column])}</span>

        {row[column] && (
          <Button
            type="outline"
            icon={isCopied ? <IconCheck size="tiny" /> : <IconClipboard size="tiny" />}
            onClick={() => handleCopyClick(column, row, rowIndex)}
            className={classNames(
              'mx-1 group-hover:block group-hover:opacity-50 hover:opacity-100',
              !isCopied && 'hidden'
            )}
            title="Copy"
          />
        )}
      </div>
    )
  }
  const columnRender = (name) => {
    return <div className="flex h-full items-center justify-center font-mono">{name}</div>
  }
  const columns = Object.keys(results[0]).map((key) => ({
    key,
    name: key,
    formatter: ({ row }) => formatter(key, row, results.indexOf(row)),
    headerRenderer: () => columnRender(key),
    resizable: true,
    width: 120,
  }))

  function onSelectedCellChange(position) {
    setCellPosition(position)
  }

  function onCopySelectedCell() {
    if (columns && cellPosition) {
      const { idx, rowIdx } = cellPosition
      const column = columns[idx]
      if (!column) return

      const colKey = column.key
      const cellValue = results[rowIdx]?.[colKey] ?? ''
      const value = formatClipboardValue(cellValue)
      copyToClipboard(value)
    }
  }

  return (
    <DataGrid
      columns={columns}
      rows={results}
      style={{ height: '100%' }}
      onSelectedCellChange={onSelectedCellChange}
    />
  )
}

function formatClipboardValue(value) {
  if (value === null) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return value
}
