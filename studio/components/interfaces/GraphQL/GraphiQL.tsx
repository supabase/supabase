/* Based on https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/components/GraphiQL.tsx */

import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ExecuteButton,
  GraphiQLProvider,
  HeaderEditor,
  MergeIcon,
  PlusIcon,
  PrettifyIcon,
  QueryEditor,
  ReloadIcon,
  ResponseEditor,
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
  useTheme,
  VariableEditor,
} from '@graphiql/react'
import { Fetcher } from '@graphiql/toolkit'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import styles from './graphiql.module.css'

export type GraphiQLProps = {
  fetcher: Fetcher
  theme?: 'dark' | 'light'
  accessToken?: string
}

const GraphiQL = ({ fetcher, theme = 'dark', accessToken }: GraphiQLProps) => {
  // Ensure props are correct
  if (typeof fetcher !== 'function') {
    throw new TypeError(
      'The `GraphiQL` component requires a `fetcher` function to be passed as prop.'
    )
  }

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      defaultHeaders={
        accessToken !== undefined
          ? JSON.stringify({ Authorization: `Bearer ${accessToken}` })
          : undefined
      }
    >
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

  const hasSingleTab = editorContext.tabs.length === 1

  return (
    <div className={clsx('graphiql-container', styles.graphiqlContainer)}>
      <div className="graphiql-main">
        <div ref={pluginResize.firstRef} style={{ minWidth: 0 }}>
          <div className={clsx('graphiql-sessions', styles.graphiqlSessions)}>
            <div
              className={clsx(
                'graphiql-session-header',
                !hasSingleTab && styles.graphiqlSessionHeader
              )}
            >
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
                {hasSingleTab ? (
                  <div className={clsx('graphiql-add-tab-wrapper', styles.graphiqlAddTabWrapper)}>
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
                  className={clsx(
                    'graphiql-editors',
                    styles.graphiqlEditors,
                    hasSingleTab && 'full-height'
                  )}
                >
                  <div ref={editorToolsResize.firstRef}>
                    <section
                      className={clsx('graphiql-query-editor', styles.graphiqlQueryEditor)}
                      aria-label="Query Editor"
                    >
                      <div className="graphiql-query-editor-wrapper text-sm">
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
                      className="graphiql-editor-tool text-sm"
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
                <div
                  className={clsx('graphiql-horizontal-drag-bar', styles.graphiqlHorizontalDragBar)}
                />
              </div>
              <div ref={editorResize.secondRef}>
                <div
                  className={clsx(
                    'graphiql-response text-sm',
                    hasSingleTab
                      ? styles.graphiqlResponseSingleTab
                      : styles.graphiqlResponseMultiTab
                  )}
                >
                  {executionContext.isFetching ? <Spinner /> : null}
                  <ResponseEditor />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={pluginResize.dragBarRef}>
          {pluginContext?.visiblePlugin ? (
            <div
              className={clsx('graphiql-horizontal-drag-bar', styles.graphiqlHorizontalDragBar)}
            />
          ) : null}
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
      <div className={clsx('graphiql-sidebar', styles.graphiqlSidebar)}>
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
        </div>
      </div>
    </div>
  )
}

export default GraphiQL
