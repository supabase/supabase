'use client'

import { Index } from '@/__registry__'
import * as React from 'react'

import { useConfig } from '@/hooks/use-config'
import { cn } from 'ui'

import { styles } from '@/registry/styles'

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  extractClassname?: boolean
  extractedClassNames?: string
  align?: 'center' | 'start' | 'end'
  peekCode?: boolean
  showGrid?: boolean
  showDottedGrid?: boolean
  wide?: boolean
}

export function CodeFragment({
  name,
  children,
  className,
  extractClassname,
  extractedClassNames,
  align = 'center',
  peekCode = false,
  showGrid = false,
  showDottedGrid = true,
  wide = false,
  ...props
}: ComponentPreviewProps) {
  const [config] = useConfig()
  const index = styles.findIndex((style) => style.name === config.style)

  const Codes = React.Children.toArray(children) as React.ReactElement[]
  const Code = Codes[index]

  const [expand, setExpandState] = React.useState(false)

  const Preview = React.useMemo(() => {
    // console.log('Index', Index)
    // console.log('name', name)
    // console.log('config.style', config.style)

    const Component = Index[config.style][name]?.component
    // const Component = Index[name]?.component

    if (!Component) {
      return (
        <p className="text-sm text-muted-foreground">
          Code fragment{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {name}
          </code>{' '}
          not found in registry.
        </p>
      )
    }

    return <Component />
  }, [name, config.style])

  const ComponentPreview = React.useMemo(() => {
    return (
      <>
        <div
          className={cn('preview flex min-h-[350px] w-full justify-center p-10', {
            'items-center': align === 'center',
            'items-start': align === 'start',
            'items-end': align === 'end',
          })}
        >
          <React.Suspense
            fallback={
              <div className="flex items-center text-sm text-muted-foreground">Loading...</div>
            }
          >
            {Preview}
          </React.Suspense>
        </div>
      </>
    )
  }, [Preview, align])

  const wideClasses = wide ? '2xl:-ml-12 2xl:-mr-12' : ''

  return (
    <div className={cn('mt-4 mb-12', wideClasses)}>
      <div
        className={cn(
          'relative rounded-md border-t border-l border-r border-b bg-studio overflow-hidden'
        )}
      >
        {showGrid && (
          <div className="pointer-events-none absolute h-full w-full bg-[linear-gradient(to_right,hsla(var(--foreground-default)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
        {showDottedGrid && (
          <div className="z-0 pointer-events-none absolute h-full w-full bg-[radial-gradient(hsla(var(--foreground-default)/0.02)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        )}
        <div className="z-10 relative">{ComponentPreview}</div>
      </div>
    </div>
  )
}
