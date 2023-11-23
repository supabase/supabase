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
        <span className="text-sm">Create Row Level Security policy</span>
        <Button
          size="tiny"
          type="default"
          icon={<AiIcon className="[&>div>div]:border-white" />}
          onClick={() => setAssistantVisible(!assistantVisible)}
        >
          {assistantVisible ? <>Close Assistant</> : <>Open Assistant</>}
        </Button>
      </div>
    </div>
  )
}
