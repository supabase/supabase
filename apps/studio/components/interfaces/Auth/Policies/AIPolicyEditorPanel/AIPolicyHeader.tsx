import { IS_PLATFORM } from 'lib/constants'
import { AiIcon, Button } from 'ui'

export const AIPolicyHeader = ({
  assistantVisible,
  setAssistantVisible,
}: {
  assistantVisible: boolean
  setAssistantVisible: (v: boolean) => void
}) => {
  return (
    <div className="space-y-1 py-4 px-4 bg-overlay sm:px-6 border-b border-overlay">
      <div className="flex flex-row justify-between items-center">
        <span className="text-sm">Create a new row level security policy</span>
        <Button
          size="tiny"
          type="default"
          className="pl-1.5 py-0.5"
          icon={<AiIcon className="scale-75 [&>div>div]:border-white -mr-0.5" />}
          onClick={() => setAssistantVisible(!assistantVisible)}
        >
          {assistantVisible ? <>Close Assistant</> : <>Open Assistant</>}
        </Button>
      </div>
    </div>
  )
}
