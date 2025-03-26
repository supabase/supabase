'use client'
import SandpackWrapper from './sandpack'
import { CodeBlock } from 'ui'
import Image from 'next/image'

type ExampleLayoutProps = {
  appJsCode: string
  files: Record<string, string>
  dependencies?: Record<string, string>
  title?: string
  description?: string
}

export default function ExampleLayout({
  appJsCode,
  files,
  dependencies = {},
  title = 'App.js',
  description = 'This is an example of a realtime app.',
}: ExampleLayoutProps) {
  const formattedCode = `// # ${title}
// ${description}

${appJsCode}`

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
        {/* Left column: Code display - hidden on mobile */}
        <CodeBlock
          hideLineNumbers
          className="!bg-transparent max-h-64 lg:max-h-full border-none p-8 h-full overflow-auto hidden lg:block"
          language="jsx"
        >
          {formattedCode}
        </CodeBlock>

        {/* Right column: Two Sandpack previews stacked vertically */}
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-muted lg:col-span-1 col-span-2">
          <div className="h-[300px] md:h-[350px] lg:h-auto lg:flex-1 border-b border-muted">
            <SandpackWrapper files={files} dependencies={dependencies} />
          </div>
          <div className="h-[300px] md:h-[350px] lg:h-auto lg:flex-1">
            <SandpackWrapper files={files} dependencies={dependencies} />
          </div>
        </div>
      </div>
    </div>
  )
}
