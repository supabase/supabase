import { useParams } from 'common'
import { Edit, Notebook, NotebookText, Play, Save } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { AiIconAnimation, Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const NotebookEditor = () => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()
  const snap = useNotebooksStateSnapshot()
  const stateNotebook = id ? snap.notebooks[id] : undefined

  const { name, content } = stateNotebook?.notebook ?? {}

  const [titleValue, setTitleValue] = useState<string>(name ?? '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const handleSaveTitle = () => {
    const trimmedName = titleValue.trim()
    if (id && trimmedName && trimmedName !== name) {
      snap.renameNotebook({ id, name: trimmedName })
      tabs.updateTab(createTabId('notebook', { id }), { label: trimmedName })
    }

    setIsEditingTitle(false)
  }

  const registerTab = useEffectEvent(() => {
    if (!id) return
    tabs.addTab({
      id: createTabId('notebook', { id }),
      type: 'notebook',
      label: name ?? 'New Notebook',
      metadata: { notebookId: id },
      isPreview: false,
    })
  })

  useEffect(() => registerTab(), [id])

  return (
    <div className="flex flex-col h-full bg-surface-100">
      <div className="border-b min-h-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-x-2">
          <NotebookText size={14} className="text-foreground-light" />
          {isEditingTitle ? (
            <Input
              autoFocus
              size="tiny"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => {
                if (isEditingTitle) handleSaveTitle()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsEditingTitle(false)
                  setTitleValue(name ?? '')
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSaveTitle()
                }
              }}
            />
          ) : (
            <Button
              variant="text"
              className="group"
              onClick={() => {
                setTitleValue(name ?? '')
                setIsEditingTitle(true)
              }}
              iconRight={<Edit className="opacity-0 group-hover:opacity-100" />}
            >
              {name}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-x-2">
          <Button variant="outline" icon={<AiIconAnimation size={16} />}>
            Analyze
          </Button>
          <ButtonTooltip
            variant="outline"
            icon={<Play />}
            className="px-1"
            tooltip={{ content: { side: 'bottom', text: 'Run notebook' } }}
          />
          <ButtonTooltip
            variant="outline"
            icon={<Save />}
            className="px-1"
            tooltip={{ content: { side: 'bottom', text: 'Save changes' } }}
          />
        </div>
      </div>

      <div className="w-full mx-auto flex-grow min-h-0 overflow-y-auto">
        <div className="p-4">
          {content?.cells.length === 0 && (
            <EmptyStatePresentational
              icon={<Notebook className="text-foreground-lighter" />}
              title="This notebook is empty"
              description="Add a query cell to run SQL against your database or logs."
              contentClassName="[&>h3]:text-sm [&>p]:text-xs"
            >
              <div className="flex items-center gap-x-2">
                <Button variant="default">Add query cell</Button>
                <Button variant="default">Add markdown cell</Button>
              </div>
            </EmptyStatePresentational>
          )}
        </div>
      </div>
    </div>
  )
}
