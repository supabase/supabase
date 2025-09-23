import { useEffect, useState } from 'react'
import remarkGfm from 'remark-gfm'

import { Markdown } from 'components/interfaces/Markdown'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'ui'

interface CellDetailPanelProps {
  column: string
  value: any
  visible: boolean
  onClose: () => void
}

export const CellDetailPanel = ({ column, value, visible, onClose }: CellDetailPanelProps) => {
  const [view, setView] = useState<'view' | 'md'>('view')

  const formattedValue =
    value === null
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value, null, '\t')
        : String(value)
  const showMarkdownToggle = typeof value === 'string'

  useEffect(() => {
    if (visible) setView('view')
  }, [visible])

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent size="lg" className="flex flex-col gap-0">
        <SheetHeader className="py-2.5">
          <SheetTitle className="flex items-center justify-between pr-7">
            <p className="truncate">
              Viewing cell details on column: <code className="text-sm">{column}</code>
            </p>
            {showMarkdownToggle && (
              <TwoOptionToggle
                options={['MD', 'view']}
                activeOption={view}
                borderOverride="border-muted"
                onClickOption={setView}
              />
            )}
          </SheetTitle>
        </SheetHeader>
        {view === 'view' ? (
          <div className="relative h-full">
            <CodeEditor
              isReadOnly
              id="sql-editor-expand-cell"
              language="json"
              value={formattedValue}
              placeholder={value === null ? 'NULL' : undefined}
              options={{ wordWrap: 'off', contextmenu: false }}
            />
          </div>
        ) : (
          <div className="flex-grow py-4 px-4 bg-default overflow-y-auto">
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="!max-w-full markdown-body"
              content={formattedValue}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
