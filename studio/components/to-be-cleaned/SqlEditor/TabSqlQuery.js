import Split from 'react-split'
import Editor from '@monaco-editor/react'
import DataGrid from '@supabase/react-data-grid'
import { toJS } from 'mobx'
import { CSVLink } from 'react-csv'
import { debounce } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
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
import * as Tooltip from '@radix-ui/react-tooltip'

import { useKeyboardShortcuts, useStore, useWindowDimensions, usePrevious } from 'hooks'
import Telemetry from 'lib/telemetry'
import { IS_PLATFORM } from 'lib/constants'
import { copyToClipboard, timeout } from 'lib/helpers'
import { useSqlStore, UTILITY_TAB_TYPES } from 'localStores/sqlEditor/SqlEditorStore'
import { SQL_SNIPPET_SCHEMA_VERSION } from './SqlEditor.constants'

const TabSqlQuery = observer(() => {
  const { content: contentStore } = useStore()
  const sqlEditorStore = useSqlStore()
  const { height: screenHeight } = useWindowDimensions()
  const snapOffset = 50
  const minSize = 44
  const tabMenuHeight = 44
  const offset = 3

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
        />
        <div>
          <UtilityPanel updateSqlSnippet={updateSqlSnippet} />
        </div>
      </Split>
    </div>
  )
})
export default TabSqlQuery

const MonacoEditor = ({ error, updateSqlSnippet }) => {
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

    // debounce changes
    debounceUpdateSqlSnippet(value)
  }

  return (
    <div className="dark:border-dark flex-grow overflow-y-auto border-b">
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
        data={sqlEditorStore.activeTab?.csvData || ''}
        filename={`supabase_${sqlEditorStore.projectRef}_${sqlEditorStore.activeTab.name}`}
      />
    </Dropdown>
  )
})

const SavingIndicator = observer(({ updateSqlSnippet }) => {
  const { content } = useStore()
  const sqlEditorStore = useSqlStore()
  const previousState = usePrevious(content.savingState)
  const [showSavedText, setShowSavedText] = useState(false)

  useEffect(() => {
    let cancel = false

    if (
      (previousState === 'CREATING' || previousState === 'UPDATING') &&
      content.savingState === 'IDLE'
    ) {
      setShowSavedText(true)
      setTimeout(() => {
        if (!cancel) setShowSavedText(false)
      }, 3000)
    }

    return () => (cancel = true)
  }, [content.savingState])

  const retry = () => {
    const [item] = content.list((item) => item.id === sqlEditorStore.selectedTabId)

    if (content.savingState === 'CREATING_FAILED' && item) {
      content.save(toJS(item))
    }

    if (content.savingState === 'UPDATING_FAILED' && item) {
      updateSqlSnippet(sqlEditorStore.activeTab.query)
    }
  }

  return (
    <div className="mx-2 flex items-center gap-2">
      {(content.savingState === 'CREATING_FAILED' || content.savingState === 'UPDATING_FAILED') && (
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
      {(content.savingState === 'CREATING' || content.savingState === 'UPDATING') && (
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
      {(content.savingState === 'CREATING_FAILED' || content.savingState === 'UPDATING_FAILED') && (
        <IconAlertCircle className="text-red-900" size={14} strokeWidth={2} />
      )}
      {showSavedText && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconCheck className="text-brand-900" size={14} strokeWidth={3} />
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
        {content.savingState === 'CREATING_FAILED' && 'Failed to create'}
        {content.savingState === 'UPDATING_FAILED' && 'Failed to save'}
      </span>
    </div>
  )
})

const UtilityActions = observer(({ updateSqlSnippet }) => {
  const sqlEditorStore = useSqlStore()

  useKeyboardShortcuts(
    {
      'Command+Enter': (event) => {
        event.preventDefault()
        executeQuery()
      },
    },
    ['INPUT']
  )

  async function executeQuery() {
    if (sqlEditorStore.isExecuting) return
    await sqlEditorStore.startExecuting()
  }

  return (
    <>
      <SavingIndicator updateSqlSnippet={updateSqlSnippet} />
      {IS_PLATFORM && <FavoriteButton />}
      <SizeToggleButton />
      <Button
        onClick={executeQuery}
        disabled={sqlEditorStore.isExecuting}
        loading={sqlEditorStore.isExecuting}
        type="text"
        size="tiny"
        shadow={false}
        className="mx-2"
      >
        RUN
      </Button>
    </>
  )
})

const SizeToggleButton = observer(() => {
  const sqlEditorStore = useSqlStore()

  function maximizeEditor() {
    sqlEditorStore.activeTab.collapseUtilityTab()
  }

  function restorePanelSize() {
    sqlEditorStore.activeTab.restorePanelSize()
  }

  return (
    <>
      {sqlEditorStore.activeTab.utilityTabHeight != 0 && (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={maximizeEditor}
          icon={<IconChevronDown className="text-gray-1100" size="tiny" strokeWidth={2} />}
          tooltip={{
            title: 'Maximize editor',
            position: 'top',
          }}
        />
      )}
      {sqlEditorStore.activeTab.utilityTabHeight == 0 && (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={restorePanelSize}
          icon={<IconChevronUp className="text-gray-1100" size="tiny" strokeWidth={2} />}
          tooltip={{
            title: 'Restore panel size',
            position: 'top',
          }}
        />
      )}
    </>
  )
})

const FavoriteButton = observer(() => {
  const { ui, content: contentStore } = useStore()
  const { profile: user } = ui

  const sqlEditorStore = useSqlStore()

  const [loading, setLoading] = useState(false)

  const id = sqlEditorStore.activeTab.id

  /*
   * `content` column json structure
   */
  let contentPayload = {
    schema_version: '1.0',
    content_id: id,
    sql: sqlEditorStore.activeTab.query,
  }

  async function addToFavorite() {
    try {
      setLoading(true)
      /*
       * remote db handling
       */
      await contentStore.updateSql(id, {
        content: {
          ...contentPayload,
          favorite: true,
        },
      })

      /*
       * old localstorage handling
       */
      const { query, name, desc } = sqlEditorStore.activeTab || {}
      sqlEditorStore.addToFavorite(id, query, name, desc)
      Telemetry.sendEvent('sql_editor', 'sql_favourited', name)

      /*
       * reload sql data in store and re-select tab
       */
      sqlEditorStore.loadTabs(sqlEditorStore.tabsFromContentStore(contentStore, user?.id), false)
      sqlEditorStore.selectTab(id)

      setLoading(false)
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to add to favourites: ${error.message}`,
      })
      setLoading(false)
    }
  }

  async function unFavorite() {
    const id = sqlEditorStore.activeTab.id
    try {
      setLoading(true)
      /*
       * remote db handling
       */
      await contentStore.updateSql(id, {
        content: {
          ...contentPayload,
          favorite: false,
        },
      })

      /*
       * old localstorage handling
       */
      const { name } = sqlEditorStore.activeTab || {}
      sqlEditorStore.unFavorite(id)
      Telemetry.sendEvent('sql_editor', 'sql_unfavourited', name)

      /*
       * reload sql data in store and re-select tab
       */
      sqlEditorStore.loadTabs(sqlEditorStore.tabsFromContentStore(contentStore, user?.id), false)
      sqlEditorStore.selectTab(id)
      setLoading(false)
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to remove from favourites: ${error.message}`,
      })
      setLoading(false)
    }
  }

  return (
    <>
      {sqlEditorStore.activeTab.favorite ? (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={unFavorite}
          loading={loading}
          icon={<IconHeart size="tiny" fill="#48bb78" />}
        />
      ) : (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={addToFavorite}
          loading={loading}
          icon={<IconHeart size="tiny" fill="gray" />}
        />
      )}
    </>
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
        <Typography.Text>
          <p className="m-0 border-0 px-6 py-4 font-mono">{sqlEditorStore.activeTab.errorResult}</p>
        </Typography.Text>
      </div>
    )
  } else if (sqlEditorStore.activeTab.hasNoResult) {
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
    <div style={{ height: sqlEditorStore.activeTab.utilityTabHeight }}>
      <Results results={sqlEditorStore.activeTab.results} />
    </div>
  )
})

const Results = ({ results }) => {
  const [cellPosition, setCellPosition] = useState(undefined)

  useKeyboardShortcuts(
    {
      'Command+c': (event) => {
        event.stopPropagation()
        onCopyCell()
      },
      'Control+c': (event) => {
        event.stopPropagation()
        onCopyCell()
      },
    },
    ['INPUT', 'TEXTAREA']
  )

  if (results?.error) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <Typography.Text type="danger">
          <p className="m-0 border-0 px-6 py-4 font-mono"> {`ERROR: ${results.error}`}</p>
        </Typography.Text>
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

  const formatter = (column, row) => {
    return <span className="font-mono text-xs">{JSON.stringify(row[column])}</span>
  }
  const columnRender = (name) => {
    return <div className="flex h-full items-center justify-center font-mono">{name}</div>
  }
  const columns = Object.keys(results[0]).map((key) => ({
    key,
    name: key,
    formatter: ({ row }) => formatter(key, row),
    headerRenderer: () => columnRender(key),
    resizable: true,
    width: 120,
  }))

  function onSelectedCellChange(position) {
    setCellPosition(position)
  }

  function onCopyCell() {
    if (columns && cellPosition) {
      const { idx, rowIdx } = cellPosition
      const colKey = columns[idx].key
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
