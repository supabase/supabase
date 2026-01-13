'use client'
import SandpackWrapper from './sandpack'
import { Button, CodeBlock } from 'ui'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Code, Eye } from 'lucide-react'

export type ExampleLayoutProps = {
  appJsCode: string
  files: Record<string, string>
  dependencies?: Record<string, string>
  title?: string
  description?: string
  onPrevious?: () => void
  onNext?: () => void
}

export default function ExampleLayout({
  appJsCode,
  files,
  dependencies = {},
  title = 'App.js',
  description = 'This is an example of a realtime app.',
  onPrevious,
  onNext,
}: ExampleLayoutProps) {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview')

  const formattedCode = `// # ${title}
// ${description}

${appJsCode}`

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="grid grid-cols-3 items-center px-2 py-2 border-b border-muted">
        {/* Left side: Code/Preview Toggle */}
        <div>
          <div className="flex w-fit gap-1">
            <Button
              type="text"
              onClick={() => setViewMode('code')}
              icon={<Code size={14} />}
              size="tiny"
              className={`${viewMode === 'code' ? 'bg-surface-200 text-foreground' : ''}`}
              aria-label="Show code"
            >
              <span className="hidden sm:inline">Code</span>
            </Button>
            <Button
              type="text"
              onClick={() => setViewMode('preview')}
              size="tiny"
              icon={<Eye size={14} />}
              className={`${viewMode === 'preview' ? 'bg-surface-200 text-foreground' : ''}`}
              aria-label="Show preview"
            >
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </div>
        </div>
        {/* Center: Title */}
        <div className="text-sm font-medium truncate mx-2 text-center">{title}</div>

        {/* Right: Navigation */}
        <div className="flex gap-1 justify-end">
          <Button
            type="outline"
            onClick={onPrevious}
            disabled={!onPrevious}
            className="p-1 rounded hover:bg-surface-200 text-foreground-light disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous example"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            type="outline"
            onClick={onNext}
            disabled={!onNext}
            className="p-1 rounded hover:bg-surface-200 text-foreground-light disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next example"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        /* Previews - shown when in preview mode */
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-muted">
          <div className="h-96 lg:h-full">
            <SandpackWrapper files={files} dependencies={dependencies} />
          </div>
          <div className="h-96 lg:h-full">
            <SandpackWrapper files={files} dependencies={dependencies} />
          </div>
        </div>
      ) : (
        /* Code view - shown when in code mode */
        <CodeBlock
          hideLineNumbers
          wrapperClassName="w-full"
          className="!bg-transparent h-[500px] lg:h-full overflow-auto p-8 border-none rounded-none"
          wrapLines
          language="jsx"
        >
          {formattedCode}
        </CodeBlock>
      )}
    </div>
  )
}
