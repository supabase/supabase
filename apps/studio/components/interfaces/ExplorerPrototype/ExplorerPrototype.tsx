/**
 * PROTOTYPE — the Explorer content area.
 *
 * A tab strip plus a renderer that switches on `tab.resource.type`. This is the
 * top of the design diagram: the shell knows about resource *types*, and nothing
 * else about what a resource contains.
 *
 * It sits inside the same project chrome as the SQL editor — `DefaultLayout` →
 * `ProjectLayoutWithAuth` (see the page's `getLayout`) — and fills the same
 * slots: the sidebar goes in `productMenu`, this goes in `children`. The inner
 * markup deliberately mirrors `EditorBaseLayout` so the tab strip lines up with
 * the real editor's.
 *
 * Reference only — mock data, fake execution, throwaway state.
 */

import { Admonition } from 'ui-patterns/Admonition'

import type { Tab } from './ExplorerPrototype.types'
import { useExplorerPrototype } from './ExplorerPrototypeContext'
import { ExplorerTabBar } from './ExplorerTabBar'
import { QueryCell } from './QueryCell'
import { notebookTitle } from './ExplorerResources'
import { ChatView } from './views/ChatView'
import { HomeView } from './views/HomeView'
import { NotebookView } from './views/NotebookView'

export const ExplorerPrototype = () => {
  const state = useExplorerPrototype()
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId)
  const isHomeActive = state.activeTabId === 'home'
  const notebookTargets = Object.entries(state.notebooks).map(([id, notebook]) => ({
    id,
    title: notebookTitle(notebook),
  }))

  const renderTab = (tab: Tab) => {
    if (tab.resource.type === 'query') {
      const query = state.queries[tab.resource.id]
      if (!query) return null
      return (
        <QueryCell
          full
          value={query}
          result={state.results[query.id] ?? { status: 'idle' }}
          rowLimit={100}
          notebookTargets={notebookTargets}
          onAddToNotebook={(notebookId) => state.addQueryToNotebook(query, notebookId)}
          onExplain={() => state.explainQuery(query)}
          onChange={(next) => state.updateQuery(query.id, next)}
          onRun={() => state.runCell(query, 100)}
        />
      )
    }

    if (tab.resource.type === 'notebook') {
      const notebookId = tab.resource.id
      const notebook = state.notebooks[notebookId]
      if (!notebook) return null
      return (
        <NotebookView
          title={tab.title}
          notebook={notebook}
          results={state.results}
          onCellChange={(cellId, cell) => state.updateCell(notebookId, cellId, cell)}
          onAddCell={(type, afterCellId) => state.addCell(notebookId, type, afterCellId)}
          onRemoveCell={(cellId) => state.removeCell(notebookId, cellId)}
          onMoveCell={(cellId, direction) => state.moveCell(notebookId, cellId, direction)}
          onMoveCellTo={(cellId, targetCellId, placement) =>
            state.moveCellTo(notebookId, cellId, targetCellId, placement)
          }
          onSettingsChange={(settings) => state.updateNotebookSettings(notebookId, settings)}
          onRunCell={(cell, rowLimit) => state.runCell(cell, rowLimit)}
          onRunAll={() => state.runNotebook(notebookId)}
          notebookTargets={notebookTargets}
          onAddQueryToNotebook={state.addQueryToNotebook}
          onExplainQuery={state.explainQuery}
          onAnalyse={() => state.analyseNotebook(tab.title)}
        />
      )
    }

    const chat = state.chats[tab.resource.id]
    if (!chat) return null
    return (
      <ChatView
        chat={chat}
        results={state.results}
        onApprove={(messageId, cell) => {
          state.setChatApproval(chat.id, messageId, 'approved')
          state.runCell(cell, 100)
        }}
        onApproveNotebook={(messageId, title, notebook) =>
          state.createNotebookFromChat(chat.id, messageId, title, notebook)
        }
        onDeny={(messageId) => state.setChatApproval(chat.id, messageId, 'denied')}
        onSendMessage={(message) => state.sendChatMessage(chat.id, message)}
        notebookTargets={notebookTargets}
        onAddQueryToNotebook={state.addQueryToNotebook}
        onExplainQuery={state.explainQuery}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center border-b bg-transparent md:min-h-(--header-height)">
        <ExplorerTabBar
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          dirtyResources={state.dirtyResources}
          isHomeActive={isHomeActive}
          onHomeSelect={() => state.setActiveTabId('home')}
          onCreateQuery={state.createQuery}
          onCreateNotebook={state.createNotebook}
          onCreateChat={() => state.createChat()}
          onSelect={state.setActiveTabId}
          onClose={state.closeTab}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted">
        {isHomeActive ? (
          <HomeView
            onCreateQuery={state.createQuery}
            onCreateNotebook={state.createNotebook}
            onCreateChat={state.createChat}
          />
        ) : activeTab ? (
          renderTab(activeTab)
        ) : (
          <div className="mx-auto max-w-lg p-10">
            <Admonition
              type="default"
              title="No tabs open"
              description="Choose a notebook or chat from the sidebar, or start a new query."
            />
          </div>
        )}
      </div>
    </div>
  )
}
