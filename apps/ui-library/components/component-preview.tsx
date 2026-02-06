'use client'

import { ChevronRight } from 'lucide-react'
import * as React from 'react'
import { cn, Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_ } from 'ui'

import { Index } from '@/__registry__'
import { useConfig } from '@/hooks/use-config'
import { styles } from '@/registry/styles'

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: keyof (typeof Index)['default']
  extractClassname?: boolean
  extractedClassNames?: string
  align?: 'center' | 'start' | 'end'
  showGrid?: boolean
  showDottedGrid?: boolean
  showCode?: boolean
  wide?: boolean
}

export function ComponentPreview({
  name,
  children,
  className,
  extractClassname,
  extractedClassNames,
  align = 'center',
  showGrid = false,
  showDottedGrid = true,
  showCode = true,
  wide = false,
  ...props
}: ComponentPreviewProps) {
  const [config] = useConfig()
  const index = styles.findIndex((style) => style.name === config.style)

  const Preview = React.useMemo(() => {
    const Component = Index['default'][name]?.component

    if (!Component) {
      return (
        <p className="text-sm text-muted-foreground">
          Component{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {name}
          </code>{' '}
          not found in registry.
        </p>
      )
    }

    return <Component />
  }, [name, config.style])

  const Codes = React.Children.toArray(children) as React.ReactElement[]
  const Code = Codes[index]

  const ComponentPreview = React.useMemo(() => {
    return (
      <>
        <div
          className={cn('preview flex min-h-[350px] w-full justify-center p-10 theme-original', {
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
          'relative bg-studio',
          showCode ? 'rounded-tl-md rounded-tr-md border-t border-l border-r' : 'rounded-md border'
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
      {showCode && (
        <Collapsible_Shadcn_>
          <CollapsibleTrigger_Shadcn_
            className={`
            flex 
            gap-3 items-center 
            w-full
            font-mono
            text-xs 
            text-foreground-light
            px-4 py-4 
            border border-r 
            group
            data-[state=closed]:rounded-bl-md data-[state=closed]:rounded-br-md
            
        `}
          >
            <ChevronRight
              className="transition-all group-data-[state=open]:rotate-90 text-foreground-lighter"
              size={14}
            />
            View code
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="transition-all">
            <div
              className={cn(
                'relative',
                'w-full rounded-md [&_pre]:my-0',
                '[&_pre]:overflow-auto',
                '[&_pre]:max-h-[320px]',
                '[&_pre]:rounded-tr-none [&_pre]:rounded-tl-none [&_pre]:border-t-transparent'
              )}
            >
              {Code}
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>
      )}
    </div>
  )
}
