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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <div className="col-span-full grid grid-cols-1 md:grid-cols-2 min-h-[250px] gap-2">
        <SandpackWrapper files={files} dependencies={dependencies} />
        <SandpackWrapper files={files} dependencies={dependencies} />
      </div>

      <div className="p-4 md:p-6 border bg-surface-75 h-fit rounded-lg relative overflow-hidden">
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
        <h1 className="relative text-xl font-medium text-foreground mb-2">{title}</h1>
        <p className="relative text-sm text-foreground-light">{description}</p>
      </div>
      <div className="md:col-span-2 flex-1 rounded-lg border bg-surface-75 overflow-auto max-h-96 lg:max-h-none">
        <CodeBlock className="border-none !bg-surface-75 max-h-96" language="jsx">
          {appJsCode}
        </CodeBlock>
      </div>
    </div>
  )
}
