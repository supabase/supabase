import type { ReactNode } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

export interface SnippetEditorShellProps {
  editorPanel: ReactNode
  utilityPanel: ReactNode
  footer?: ReactNode
  defaultSplitSize?: number
  /** When true, only the utility panel is shown (e.g. notebook blocks with SQL collapsed) */
  hideEditorPanel?: boolean
}

export const SnippetEditorShell = ({
  editorPanel,
  utilityPanel,
  footer,
  defaultSplitSize = 50,
  hideEditorPanel = false,
}: SnippetEditorShellProps) => {
  if (hideEditorPanel) {
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-grow">{utilityPanel}</div>
        {footer}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup orientation="vertical" className="flex-grow h-full">
        <ResizablePanel defaultSize={defaultSplitSize} minSize={30}>
          {editorPanel}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={100 - defaultSplitSize} maxSize="70">
          {utilityPanel}
        </ResizablePanel>

        {footer}
      </ResizablePanelGroup>
    </div>
  )
}
