import { AssistantMessage } from '@/lib/types'
import { CheckIcon } from 'lucide-react'
import { cn } from 'ui'

interface AIChatProps {
  message: AssistantMessage
  isSelected?: boolean
  onSelect: (id: string) => void
}

const AIChat = ({ message, isSelected, onSelect }: AIChatProps) => {
  return (
    <div
      key={message.id}
      className={cn(
        'flex flex-row items-center justify-between',
        'text-sm bg-blue-500 p-4 w-3/4 rounded-lg self-end cursor-pointer border border-blue-500 hover:border-white'
      )}
      onClick={() => onSelect(message.id)}
    >
      AI answer
      {isSelected && (
        // <div className="bg-white text-black rounded">
        <CheckIcon strokeWidth={3} size={18} className="bg-white text-black rounded p-0.5" />
        // </div>
      )}
    </div>
  )
}

export default AIChat
