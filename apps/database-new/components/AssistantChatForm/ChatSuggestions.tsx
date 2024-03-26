import { CHAT_EXAMPLES } from '@/data/chat-examples'
import { cn } from '@ui/lib/utils/cn'
import { ExternalLink } from 'lucide-react'

export const ChatSuggestions = ({ setInput }: { setInput: (s: string) => void }) => {
  const suggestions = CHAT_EXAMPLES
  return (
    <div className="flex gap-3 mt-4">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          type="button"
          className={cn(
            'text-xs',
            'flex items-center gap-3 !pr-3',
            'transition border rounded-full px-3 py-1.5',
            'text-light',
            'hover:border-stronger hover:text'
          )}
          onClick={(event) => {
            setInput(suggestion.prompt)
            event.preventDefault()
          }}
        >
          {suggestion.label}
          <ExternalLink size={12} />
        </button>
      ))}
    </div>
  )
}
