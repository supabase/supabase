import { ResizableHandle, ResizablePanel } from 'ui'
import { LogsList } from './LogsList'

export const LogsListPanel = (selectedRow: any) => {
  return (
    selectedRow?.original?.logs &&
    selectedRow?.original?.logs?.length > 0 && (
      <>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={20}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-medium">
                Function Logs (
                {selectedRow?.original?.logs && Array.isArray(selectedRow?.original?.logs)
                  ? selectedRow?.original?.logs?.length
                  : 0}
                )
              </h3>
            </div>
            <div className="flex-grow overflow-auto">
              <LogsList logs={selectedRow?.original?.logs} />
            </div>
          </div>
        </ResizablePanel>
      </>
    )
  )
}
