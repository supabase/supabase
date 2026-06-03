import type { ReactNode } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

export interface SnippetEditorShellProps {
  editorPanel: ReactNode
  utilityPanel: ReactNode
  footer?: ReactNode
  header?: ReactNode
  defaultSplitSize?: number
  /** When true, only the utility panel is shown (e.g. notebook blocks with SQL collapsed) */
  hideEditorPanel?: boolean
  /** When true, only the SQL editor is shown (e.g. assistant blocks awaiting query approval) */
  hideUtilityPanel?: boolean
}

export const SnippetEditorShell = ({
  editorPanel,
  utilityPanel,
  footer,
  header,
  defaultSplitSize = 50,
  hideEditorPanel = false,
  hideUtilityPanel = false,
}: SnippetEditorShellProps) => {
  if (hideEditorPanel) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="min-h-0 flex-grow">{utilityPanel}</div>
        {footer}
      </div>
    )
  }

  if (hideUtilityPanel) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="min-h-0 flex-grow">{editorPanel}</div>
        {footer}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {header}
      <ResizablePanelGroup orientation="vertical" className="flex-grow h-full min-h-0">
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
