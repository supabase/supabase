/* Based on https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/components/GraphiQL.tsx */

import {
  Button,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  Dialog,
  ExecuteButton,
  GraphiQLProvider,
  HeaderEditor,
  KeyboardShortcutIcon,
  MergeIcon,
  PlusIcon,
  PrettifyIcon,
  QueryEditor,
  ReloadIcon,
  ResponseEditor,
  SettingsIcon,
  Spinner,
  Tab,
  Tabs,
  ToolbarButton,
  Tooltip,
  UnStyledButton,
  useCopyQuery,
  useDragResize,
  useEditorContext,
  useExecutionContext,
  useMergeQuery,
  usePluginContext,
  usePrettifyEditors,
  useSchemaContext,
  useStorageContext,
  useTheme,
  VariableEditor,
} from '@graphiql/react'
import { Fetcher } from '@graphiql/toolkit'
import clsx from 'clsx'
import 'graphiql/graphiql.css'
import { PropsWithChildren, useEffect, useState } from 'react'
import styles from './graphiql.module.css'

export type GraphiQLProps = {
  fetcher: Fetcher
  theme?: 'dark' | 'light'
  apiKey?: string
}

const GraphiQL = ({ fetcher, theme = 'dark', apiKey }: GraphiQLProps) => {
  // Ensure props are correct
  if (typeof fetcher !== 'function') {
    throw new TypeError(
      'The `GraphiQL` component requires a `fetcher` function to be passed as prop.'
    )
  }

  return (
    <GraphiQLProvider fetcher={fetcher} defaultHeaders={JSON.stringify({ apiKey }, null, 2)}>
      <GraphiQLInterface theme={theme} />
    </GraphiQLProvider>
  )
}

type GraphiQLInterfaceProps = {
  theme: 'dark' | 'light'
}

export const GraphiQLInterface = ({ theme }: GraphiQLInterfaceProps) => {
  const editorContext = useEditorContext({ nonNull: true })
  const executionContext = useExecutionContext({ nonNull: true })
  const schemaContext = useSchemaContext({ nonNull: true })
  const storageContext = useStorageContext()
  const pluginContext = usePluginContext()

  const copy = useCopyQuery()
  const merge = useMergeQuery()
  const prettify = usePrettifyEditors()

  const { setTheme } = useTheme()
  useEffect(() => {
    setTheme(theme)
  }, [theme])

  const PluginContent = pluginContext?.visiblePlugin?.content

  const pluginResize = useDragResize({
    defaultSizeRelation: 1 / 3,
    direction: 'horizontal',
    initiallyHidden: pluginContext?.visiblePlugin ? undefined : 'second',
    onHiddenElementChange: (resizableElement) => {
      if (resizableElement === 'first') {
        pluginContext?.setVisiblePlugin(null)
      }
    },
    sizeThresholdSecond: 200,
    storageKey: 'docExplorerFlex',
  })
  const editorResize = useDragResize({
    direction: 'horizontal',
    storageKey: 'editorFlex',
  })
  const editorToolsResize = useDragResize({
    defaultSizeRelation: 3,
    direction: 'vertical',
    initiallyHidden: (() => {
      return editorContext.initialVariables || editorContext.initialHeaders ? undefined : 'second'
    })(),
    sizeThresholdSecond: 60,
    storageKey: 'secondaryEditorFlex',
  })

  const [activeSecondaryEditor, setActiveSecondaryEditor] = useState<'variables' | 'headers'>(
    () => {
      return !editorContext.initialVariables && editorContext.initialHeaders
        ? 'headers'
        : 'variables'
    }
  )
  const [showDialog, setShowDialog] = useState<'settings' | 'short-keys' | null>(null)
  const [clearStorageStatus, setClearStorageStatus] = useState<'success' | 'error' | null>(null)

  const logo = <GraphiQLLogo />

  const toolbar = (
    <>
      <ToolbarButton onClick={() => prettify()} label="Prettify query (Shift-Ctrl-P)">
        <PrettifyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton onClick={() => merge()} label="Merge fragments into query (Shift-Ctrl-M)">
        <MergeIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton onClick={() => copy()} label="Copy query (Shift-Ctrl-C)">
        <CopyIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
    </>
  )

  const onClickReference = () => {
    if (pluginResize.hiddenElement === 'second') {
      pluginResize.setHiddenElement(null)
    }
  }

  const modifier =
    window.navigator.platform.toLowerCase().indexOf('mac') === 0 ? (
      <code className="graphiql-key">Cmd</code>
    ) : (
      <code className="graphiql-key">Ctrl</code>
    )

  return (
    <div className={clsx('graphiql-container', styles.graphiqlContainer)}>
      <div className="graphiql-main">
        <div ref={pluginResize.firstRef} style={{ minWidth: 0 }}>
          <div className={clsx('graphiql-sessions', styles.graphiqlSessions)}>
            <div className="graphiql-session-header">
              <Tabs aria-label="Select active operation">
                {editorContext.tabs.length > 1 ? (
                  <>
                    {editorContext.tabs.map((tab, index) => (
                      <Tab key={tab.id} isActive={index === editorContext.activeTabIndex}>
                        <Tab.Button
                          aria-controls="graphiql-session"
                          id={`graphiql-session-tab-${index}`}
                          onClick={() => {
                            executionContext.stop()
                            editorContext.changeTab(index)
                          }}
                        >
                          {tab.title}
                        </Tab.Button>
                        <Tab.Close
                          onClick={() => {
                            if (editorContext.activeTabIndex === index) {
                              executionContext.stop()
                            }
                            editorContext.closeTab(index)
                          }}
                        />
                      </Tab>
                    ))}
                    <div>
                      <Tooltip label="Add tab">
                        <UnStyledButton
                          type="button"
                          className="graphiql-tab-add"
                          onClick={() => editorContext.addTab()}
                          aria-label="Add tab"
                        >
                          <PlusIcon aria-hidden="true" />
                        </UnStyledButton>
                      </Tooltip>
                    </div>
                  </>
                ) : null}
              </Tabs>
              <div className="graphiql-session-header-right">
                {editorContext.tabs.length === 1 ? (
                  <div className="graphiql-add-tab-wrapper">
                    <Tooltip label="Add tab">
                      <UnStyledButton
                        type="button"
                        className="graphiql-tab-add"
                        onClick={() => editorContext.addTab()}
                        aria-label="Add tab"
                      >
                        <PlusIcon aria-hidden="true" />
                      </UnStyledButton>
                    </Tooltip>
                  </div>
                ) : null}
                {logo}
              </div>
            </div>
            <div
              role="tabpanel"
              id="graphiql-session"
              className={clsx('graphiql-session', styles.graphiqlSession)}
              aria-labelledby={`graphiql-session-tab-${editorContext.activeTabIndex}`}
            >
              <div ref={editorResize.firstRef}>
                <div
                  className={`graphiql-editors ${styles.graphiqlEditors}${
                    editorContext.tabs.length === 1 ? ' full-height' : ''
                  }`}
                >
                  <div ref={editorToolsResize.firstRef}>
                    <section className="graphiql-query-editor" aria-label="Query Editor">
                      <div className="graphiql-query-editor-wrapper">
                        <QueryEditor />
                      </div>
                      <div className="graphiql-toolbar" role="toolbar" aria-label="Editor Commands">
                        <ExecuteButton />
                        {toolbar}
                      </div>
                    </section>
                  </div>
                  <div ref={editorToolsResize.dragBarRef}>
                    <div className="graphiql-editor-tools">
                      <div className="graphiql-editor-tools-tabs">
                        <UnStyledButton
                          type="button"
                          className={
                            activeSecondaryEditor === 'variables' &&
                            editorToolsResize.hiddenElement !== 'second'
                              ? 'active'
                              : ''
                          }
                          onClick={() => {
                            if (editorToolsResize.hiddenElement === 'second') {
                              editorToolsResize.setHiddenElement(null)
                            }
                            setActiveSecondaryEditor('variables')
                          }}
                        >
                          Variables
                        </UnStyledButton>

                        <UnStyledButton
                          type="button"
                          className={
                            activeSecondaryEditor === 'headers' &&
                            editorToolsResize.hiddenElement !== 'second'
                              ? 'active'
                              : ''
                          }
                          onClick={() => {
                            if (editorToolsResize.hiddenElement === 'second') {
                              editorToolsResize.setHiddenElement(null)
                            }
                            setActiveSecondaryEditor('headers')
                          }}
                        >
                          Headers
                        </UnStyledButton>
                      </div>
                      <Tooltip
                        label={
                          editorToolsResize.hiddenElement === 'second'
                            ? 'Show editor tools'
                            : 'Hide editor tools'
                        }
                      >
                        <UnStyledButton
                          type="button"
                          onClick={() => {
                            editorToolsResize.setHiddenElement(
                              editorToolsResize.hiddenElement === 'second' ? null : 'second'
                            )
                          }}
                          aria-label={
                            editorToolsResize.hiddenElement === 'second'
                              ? 'Show editor tools'
                              : 'Hide editor tools'
                          }
                        >
                          {editorToolsResize.hiddenElement === 'second' ? (
                            <ChevronUpIcon className="graphiql-chevron-icon" aria-hidden="true" />
                          ) : (
                            <ChevronDownIcon className="graphiql-chevron-icon" aria-hidden="true" />
                          )}
                        </UnStyledButton>
                      </Tooltip>
                    </div>
                  </div>
                  <div ref={editorToolsResize.secondRef}>
                    <section
                      className="graphiql-editor-tool"
                      aria-label={activeSecondaryEditor === 'variables' ? 'Variables' : 'Headers'}
                    >
                      <VariableEditor
                        isHidden={activeSecondaryEditor !== 'variables'}
                        onClickReference={onClickReference}
                      />

                      <HeaderEditor isHidden={activeSecondaryEditor !== 'headers'} />
                    </section>
                  </div>
                </div>
              </div>
              <div ref={editorResize.dragBarRef}>
                <div className="graphiql-horizontal-drag-bar" />
              </div>
              <div ref={editorResize.secondRef}>
                <div className="graphiql-response">
                  {executionContext.isFetching ? <Spinner /> : null}
                  <ResponseEditor />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={pluginResize.dragBarRef}>
          {pluginContext?.visiblePlugin ? <div className="graphiql-horizontal-drag-bar" /> : null}
        </div>

        <div
          ref={pluginResize.secondRef}
          style={{
            // Make sure the container shrinks when containing long
            // non-breaking texts
            minWidth: '200px',
          }}
        >
          <div className="graphiql-plugin">{PluginContent ? <PluginContent /> : null}</div>
        </div>
      </div>
      <div className="graphiql-sidebar">
        <div className="graphiql-sidebar-section">
          {pluginContext?.plugins.map((plugin) => {
            const isVisible = plugin === pluginContext.visiblePlugin
            const label = `${isVisible ? 'Hide' : 'Show'} ${plugin.title}`
            const Icon = plugin.icon
            return (
              <Tooltip key={plugin.title} label={label}>
                <UnStyledButton
                  type="button"
                  className={isVisible ? 'active' : ''}
                  onClick={() => {
                    if (isVisible) {
                      pluginContext.setVisiblePlugin(null)
                      pluginResize.setHiddenElement('second')
                    } else {
                      pluginContext.setVisiblePlugin(plugin)
                      pluginResize.setHiddenElement(null)
                    }
                  }}
                  aria-label={label}
                >
                  <Icon aria-hidden="true" />
                </UnStyledButton>
              </Tooltip>
            )
          })}
        </div>
        <div className="graphiql-sidebar-section">
          <Tooltip label="Re-fetch GraphQL schema">
            <UnStyledButton
              type="button"
              disabled={schemaContext.isFetching}
              onClick={() => schemaContext.introspect()}
              aria-label="Re-fetch GraphQL schema"
            >
              <ReloadIcon
                className={schemaContext.isFetching ? 'graphiql-spin' : ''}
                aria-hidden="true"
              />
            </UnStyledButton>
          </Tooltip>
          <Tooltip label="Open short keys dialog">
            <UnStyledButton
              type="button"
              onClick={() => setShowDialog('short-keys')}
              aria-label="Open short keys dialog"
            >
              <KeyboardShortcutIcon aria-hidden="true" />
            </UnStyledButton>
          </Tooltip>
          <Tooltip label="Open settings dialog">
            <UnStyledButton
              type="button"
              onClick={() => setShowDialog('settings')}
              aria-label="Open settings dialog"
            >
              <SettingsIcon aria-hidden="true" />
            </UnStyledButton>
          </Tooltip>
        </div>
      </div>
      <Dialog isOpen={showDialog === 'short-keys'} onDismiss={() => setShowDialog(null)}>
        <div className="graphiql-dialog-header">
          <div className="graphiql-dialog-title">Short Keys</div>
          <Dialog.Close onClick={() => setShowDialog(null)} />
        </div>
        <div className="graphiql-dialog-section">
          <div>
            <table className="graphiql-table">
              <thead>
                <tr>
                  <th>Short key</th>
                  <th>Function</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {modifier}
                    {' + '}
                    <code className="graphiql-key">F</code>
                  </td>
                  <td>Search in editor</td>
                </tr>
                <tr>
                  <td>
                    {modifier}
                    {' + '}
                    <code className="graphiql-key">K</code>
                  </td>
                  <td>Search in documentation</td>
                </tr>
                <tr>
                  <td>
                    {modifier}
                    {' + '}
                    <code className="graphiql-key">Enter</code>
                  </td>
                  <td>Execute query</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">P</code>
                  </td>
                  <td>Prettify editors</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">M</code>
                  </td>
                  <td>Merge fragments definitions into operation definition</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">C</code>
                  </td>
                  <td>Copy query</td>
                </tr>
                <tr>
                  <td>
                    <code className="graphiql-key">Ctrl</code>
                    {' + '}
                    <code className="graphiql-key">Shift</code>
                    {' + '}
                    <code className="graphiql-key">R</code>
                  </td>
                  <td>Re-fetch schema using introspection</td>
                </tr>
              </tbody>
            </table>
            <p>
              The editors use{' '}
              <a
                href="https://codemirror.net/5/doc/manual.html#keymaps"
                target="_blank"
                rel="noopener noreferrer"
              >
                CodeMirror Key Maps
              </a>{' '}
              that add more short keys. This instance of Graph<em>i</em>QL uses <code>sublime</code>
              .
            </p>
          </div>
        </div>
      </Dialog>
      <Dialog
        isOpen={showDialog === 'settings'}
        onDismiss={() => {
          setShowDialog(null)
          setClearStorageStatus(null)
        }}
      >
        <div className="graphiql-dialog-header">
          <div className="graphiql-dialog-title">Settings</div>
          <Dialog.Close
            onClick={() => {
              setShowDialog(null)
              setClearStorageStatus(null)
            }}
          />
        </div>

        {storageContext ? (
          <div className="graphiql-dialog-section">
            <div>
              <div className="graphiql-dialog-section-title">Clear storage</div>
              <div className="graphiql-dialog-section-caption">
                Remove all locally stored data and start fresh.
              </div>
            </div>
            <div>
              <Button
                type="button"
                state={clearStorageStatus || undefined}
                disabled={clearStorageStatus === 'success'}
                onClick={() => {
                  try {
                    storageContext?.clear()
                    setClearStorageStatus('success')
                  } catch {
                    setClearStorageStatus('error')
                  }
                }}
              >
                {clearStorageStatus === 'success'
                  ? 'Cleared data'
                  : clearStorageStatus === 'error'
                  ? 'Failed'
                  : 'Clear data'}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}

// Configure the UI by providing this Component as a child of GraphiQL.
function GraphiQLLogo<TProps>(props: PropsWithChildren<TProps>) {
  return (
    <div className="graphiql-logo">
      {props.children || (
        <a
          className="graphiql-logo-link"
          href="https://github.com/graphql/graphiql"
          target="_blank"
          rel="noreferrer"
        >
          Graph
          <em>i</em>
          QL
        </a>
      )}
    </div>
  )
}

GraphiQLLogo.displayName = 'GraphiQLLogo'

export default GraphiQL
