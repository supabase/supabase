import { Maximize2Icon } from 'lucide-react'
import { useState, type Ref } from 'react'
import { errorMessage } from 'surfaces/common'
import { ExplorerToolbarAction } from 'surfaces/explorer'
import { QueryEditor, type QueryEditorHandle, type QueryEditorProps } from 'surfaces/query'
import { Admonition } from 'ui-patterns/Admonition'

export type QueryBlockProps = Omit<QueryEditorProps, 'variant' | 'toolbarActions' | 'ref'> & {
  ref?: Ref<QueryEditorHandle>
  /** Asks the host for more room, e.g. fullscreen. Omit to hide the expand action. */
  onExpand?: () => Promise<void>
}

/** Notebook-style query block, independent of Studio's router, stores and data hooks. */
export function QueryBlock({ onExpand, ref, ...editorProps }: QueryBlockProps) {
  const expand = onExpand
  const [error, setError] = useState('')
  const [isExpanding, setIsExpanding] = useState(false)

  async function handleExpand() {
    if (!expand || isExpanding) return
    setIsExpanding(true)
    setError('')
    try {
      await expand()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setIsExpanding(false)
    }
  }

  return (
    <article aria-label={`${editorProps.title} query block`} className="flex flex-col gap-2">
      {error && (
        <Admonition type="warning" title="Failed to open query" description={`Error: ${error}`} />
      )}
      <QueryEditor
        {...editorProps}
        ref={ref}
        variant="embedded"
        toolbarActions={
          expand && (
            <ExplorerToolbarAction
              aria-label="Expand query"
              tooltip="Expand query"
              icon={<Maximize2Icon size={16} strokeWidth={2} />}
              disabled={isExpanding}
              onClick={() => void handleExpand()}
            />
          )
        }
      />
    </article>
  )
}
