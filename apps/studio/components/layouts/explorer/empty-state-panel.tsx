import { Markdown } from 'components/interfaces/Markdown'
import { Sparkles } from 'lucide-react'
import { Button } from 'ui'

interface EmptyStatePanelProps {
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  aiButtonText?: string
  onAiButtonClick?: () => void
  showIcons?: boolean
}

export const EmptyStatePanel = ({
  title = 'Active issues',
  description = 'Active issues represent work that is currently in flight or should be worked on next. There are currently no active issues in this team.',
  buttonText = 'Create new issue',
  onButtonClick,
  aiButtonText,
  onAiButtonClick,
  showIcons = true,
}: EmptyStatePanelProps) => {
  return (
    <div className="flex flex-col items-start gap-5 text-left w-full">
      {showIcons && (
        <div className="grid grid-cols-2 gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="relative h-3 w-3">
              <div className="absolute inset-0 rounded-full bg-gray-800" />
              <div className="absolute inset-0.5 rounded-full bg-gray-700" />
              {i === 1 && (
                <div className="absolute inset-0.5 rounded-full bg-gray-700 overflow-hidden">
                  <div className="h-1/2 w-full bg-gray-800" />
                </div>
              )}
              {i === 2 && (
                <div className="absolute inset-0.5 rounded-full bg-gray-700 overflow-hidden">
                  <div className="h-1/2 w-1/2 bg-gray-800" />
                </div>
              )}
              {i === 3 && (
                <div className="absolute inset-0.5 rounded-full bg-gray-700 overflow-hidden">
                  <div className="h-3/4 w-3/4 rounded-full bg-gray-800 m-0.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-base text-foreground">{title}</h2>
        <Markdown
          content={description}
          className="text-foreground-light text-sm whitespace-pre-line prose"
        />
      </div>
      {(buttonText || aiButtonText) && (
        <div className="flex gap-3">
          {buttonText && (
            <Button type="default" onClick={onButtonClick}>
              {buttonText}
            </Button>
          )}
          {aiButtonText && (
            <Button
              type="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={onAiButtonClick}
            >
              {aiButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
