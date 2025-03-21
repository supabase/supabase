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
  return (
    <div>
      <div className="lg:h-[calc(100vh-150px)] min-h-fit grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left column: Code display */}
        <div className="h-full flex flex-col gap-2 overflow-hidden">
          <div className="p-8 border bg-surface-75 rounded-lg relative overflow-hidden">
            <Image
              src="/images/product/functions/grid-gradient-dark.svg"
              alt=""
              fill
              sizes="100%"
              aria-hidden
              draggable={false}
              className="object-cover absolute z-0 inset-0 hidden dark:block"
            />
            <Image
              src="/images/product/functions/grid-gradient-light.svg"
              alt=""
              fill
              sizes="100%"
              aria-hidden
              draggable={false}
              className="object-cover absolute z-0 inset-0 dark:hidden block"
            />
            <h1 className="text-xl font-medium text-foreground mb-4">{title}</h1>
            <p className="text-foreground-light">{description}</p>
          </div>
          <div className="flex-1 rounded-lg border bg-surface-75 overflow-auto max-h-96 lg:max-h-none">
            <CodeBlock className="border-none !bg-surface-75" language="jsx">
              {appJsCode}
            </CodeBlock>
          </div>
        </div>

        {/* Right column: Two Sandpack previews stacked vertically */}
        <div className="h-full flex flex-col gap-2">
          <SandpackWrapper files={files} dependencies={dependencies} />
          <SandpackWrapper files={files} dependencies={dependencies} />
        </div>
      </div>
    </div>
  )
}
