'use client'

import { ChevronRight, Expand } from 'lucide-react'
import * as React from 'react'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'

import { Index } from '@/__registry__'
import { useConfig } from '@/hooks/use-config'
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
  hideCode?: boolean
}

export function ComponentPreview({
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
  hideCode = false,
  ...props
}: ComponentPreviewProps) {
  const [config] = useConfig()
  const index = styles.findIndex((style) => style.name === config.style)

  const Codes = React.Children.toArray(children) as React.ReactElement[]
  const Code = Codes[index]

  const [expand, setExpandState] = React.useState(false)

  const Preview = React.useMemo(() => {
    const Component = Index[config.style][name]?.component

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

  const ComponentPreview = React.useMemo(() => {
    return (
      <>
        <div
          className={cn('preview flex min-h-[256px] w-full justify-center p-10', {
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

  const wideClasses = wide ? '2xl:-ml-20 2xl:-mr-20' : ''

  if (peekCode) {
    return (
      <div className={cn('@container mt-4 mb-12', wideClasses)}>
        <div
          className={cn(
            'relative rounded-tl-md rounded-tr-md border-t border-l border-r bg-studio'
          )}
        >
          {showGrid && (
            <div className="pointer-events-none absolute h-full w-full bg-[linear-gradient(to_right,hsla(var(--foreground-default)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          )}
          {showDottedGrid && (
            <div className="z-0 pointer-events-none absolute h-full w-full bg-[radial-gradient(hsla(var(--foreground-default)/0.02)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          )}
          <div className="z-10 relative">{ComponentPreview}</div>
          {/* <div className="preview-grid-background"></div> */}
        </div>
        <div className="flex flex-col space-y-4">
          <div
            className={cn(
              'relative',
              'w-full rounded-md [&_pre]:my-0',
              expand
                ? '[&_pre]:overflow-auto'
                : 'inset-0 [&_pre]:max-h-[196px] [&_pre]:overflow-hidden',
              '[&_pre]:rounded-tr-none [&_pre]:rounded-tl-none'
            )}
          >
            {Code}
            <div className="absolute bottom-0 w-full flex justify-center mb-4">
              <Button
                className="rounded-full"
                onClick={() => setExpandState(!expand)}
                type="default"
                icon={<Expand className="text-foreground-lighter" />}
              >
                {expand ? 'Collapse code' : 'Expand code'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('mt-4 mb-12', wideClasses)}>
      <div
        className={cn('relative bg-studio', {
          'rounded-tl-md rounded-tr-md border-t border-l border-r': !hideCode,
          'rounded-md border': hideCode,
        })}
      >
        {showGrid && (
          <div className="pointer-events-none absolute h-full w-full bg-[linear-gradient(to_right,hsla(var(--foreground-default)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
        {showDottedGrid && (
          <div className="z-0 pointer-events-none absolute h-full w-full bg-[radial-gradient(hsla(var(--foreground-default)/0.02)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        )}
        <div className="z-10 relative">{ComponentPreview}</div>
      </div>
      {!hideCode && (
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
