import { Check } from 'lucide-react'

interface ChapterCompletionProps {
  chapterNumber: number
  completionMessage?: string
}

export function ChapterCompletion({ chapterNumber, completionMessage }: ChapterCompletionProps) {
  return (
    <div className="mb-16 mt-8">
      <div className="flex items-center  gap-12">
        {/* Large circle with chapter number */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <span className="text-4xl font-bold text-brand-500">{chapterNumber}</span>
          </div>

          {/* Small checkmark circle overlapping bottom-right */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center shadow-md">
            <Check className="h-6 w-6 text-white" strokeWidth={3} />
          </div>
        </div>
        <div>
          {/* Completion text */}
          <h3 className="text-2xl font-bold text-foreground mb-2">
            You've completed Chapter {chapterNumber}
          </h3>

          {completionMessage && (
            <p className="text-base text-foreground-light max-w-2xl">{completionMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}
