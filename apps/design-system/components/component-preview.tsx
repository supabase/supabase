'use client'

import * as React from 'react'
import { Index } from '@/__registry__'

import {
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'
import { useConfig } from '@/hooks/use-config'
import {
  // CopyButton,
  CopyWithClassNames,
} from '@/components/copy-button'
// import { Icons } from '@/components/icons'
// import { StyleSwitcher } from '@/components/style-switcher'
// import { ThemeWrapper } from '@/components/theme-wrapper'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

// import { LoaderCircle } from 'lucide-react'

import { styles } from '@/registry/styles'
import { ChevronRight, Expand } from 'lucide-react'

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

  const codeString = React.useMemo(() => {
    if (typeof Code?.props['data-rehype-pretty-code-fragment'] !== 'undefined') {
      const [, Button] = React.Children.toArray(Code.props.children) as React.ReactElement[]
      return Button?.props?.value || Button?.props?.__rawString__ || null
    }
  }, [Code])

  const ComponentPreview = React.useMemo(() => {
    return (
      <>
        {/* <ThemeWrapper defaultTheme="zinc"> */}
        <div
          className={cn('preview flex min-h-[350px] w-full justify-center p-10', {
            'items-center': align === 'center',
            'items-start': align === 'start',
            'items-end': align === 'end',
          })}
        >
          <React.Suspense
            fallback={
              <div className="flex items-center text-sm text-muted-foreground">
                {/* <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> */}
                {/* <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> */}
                Loading...
              </div>
            }
          >
            {Preview}
          </React.Suspense>
        </div>
        {/* </ThemeWrapper> */}
      </>
    )
  }, [Preview, align])

  const wideClasses = wide ? '2xl:-ml-12 2xl:-mr-12' : ''

  if (peekCode) {
    return (
      <div className={cn('mt-4 mb-12', wideClasses)}>
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
        className={cn('relative rounded-tl-md rounded-tr-md border-t border-l border-r bg-studio')}
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
    </div>
  )

  return (
    <div
      className={cn('group relative my-4 flex flex-col gap-2', wideClasses, className)}
      {...props}
    >
      <Tabs defaultValue="preview" className="relative mr-auto w-full">
        <div className="flex items-center justify-between pb-3">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="preview"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="relative rounded-md border bg-studio">
          {ComponentPreview}
        </TabsContent>
        <TabsContent value="code">
          <div className="flex flex-col space-y-4">
            <div className="w-full rounded-md [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
              {Code}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
