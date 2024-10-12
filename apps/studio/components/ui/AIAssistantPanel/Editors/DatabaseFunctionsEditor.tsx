import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { generatePlaceholder } from '../AIAssistant.utils'
import { Button, SheetFooter } from 'ui'

export const DatabaseFunctionsEditor = () => {
  const placeholder = generatePlaceholder()
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="relative flex-grow block">
        <CodeEditor id="database-functions" language="pgsql" placeholder={placeholder} />
      </div>
      <div className="flex flex-col">
        <SheetFooter className="bg-surface-100 flex items-center !justify-end px-5 py-4 w-full border-t">
          <Button
            type="default"
            // disabled={isExecuting || isUpdating}
            // onClick={() => onClosingPanel()}
          >
            Cancel
          </Button>
          <Button
          // disabled={isExecuting || isUpdating}
          // onClick={() => onClosingPanel()}
          >
            Save function
          </Button>
        </SheetFooter>
      </div>
    </div>
  )
}
