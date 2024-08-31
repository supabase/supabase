'use client'

import * as React from 'react'
import { CircleHelp, Info, Monitor, Smartphone, Tablet } from 'lucide-react'
import { ImperativePanelHandle } from 'react-resizable-panels'

import { useConfig } from '~/hooks/useConfig'
// import { BlockCopyCodeButton } from '@/components/block-copy-code-button'
// import { Icons } from '@/components/icons'
import { StyleSwitcher } from './block-framework-switcher'
// import { V0Button } from '@/components/v0-button'
import {
  Badge,
  CodeBlock,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import { Separator } from 'ui'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { ToggleGroup, ToggleGroupItem } from 'ui'
import { Block } from '~/registry/schema'

export function BlockPreview({ block }: { block: Block }) {
  const [config] = useConfig()
  const [isLoading, setIsLoading] = React.useState(true)
  const ref = React.useRef<ImperativePanelHandle>(null)

  if (config.framework !== block.framework) {
    return null
  }

  console.log(block.framework)

  return (
    <Tabs_Shadcn_
      id={block.name}
      defaultValue="preview"
      className="relative grid w-full scroll-m-20 gap-4"
      style={
        {
          '--container-height': block.container?.height,
        } as React.CSSProperties
      }
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <TabsList_Shadcn_ className="hidden sm:flex">
            <TabsTrigger_Shadcn_ value="preview">Preview</TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="code">Code</TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
          <div className="hidden items-center gap-2 sm:flex">
            <Separator orientation="vertical" className="mx-2 hidden h-4 md:flex" />
            <div className="flex items-center gap-2">
              <a href={`#${block.name}`}>
                <Badge variant="default">{block.name}</Badge>
              </a>
              <Popover_Shadcn_>
                <PopoverTrigger_Shadcn_ className="hidden text-muted-foreground hover:text-foreground sm:flex">
                  <Info className="h-3.5 w-3.5 text-foreground-muted" />
                  <span className="sr-only">Block description</span>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ side="right" sideOffset={10} className="text-xs">
                  {block.description}
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </div>
          </div>
        </div>
        {block.code && (
          <div className="flex items-center gap-2 pr-[14px] sm:ml-auto">
            <div className="hidden h-[28px] items-center gap-1.5 rounded-md border p-[2px] shadow-sm md:flex">
              <ToggleGroup
                type="single"
                defaultValue="100"
                onValueChange={(value) => {
                  if (ref.current) {
                    ref.current.resize(parseInt(value))
                  }
                }}
              >
                <ToggleGroupItem value="100" className="h-[22px] w-[22px] rounded-sm p-0">
                  <Monitor className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="60" className="h-[22px] w-[22px] rounded-sm p-0">
                  <Tablet className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="25" className="h-[22px] w-[22px] rounded-sm p-0">
                  <Smartphone className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Separator orientation="vertical" className="mx-2 hidden h-4 md:flex" />
            <StyleSwitcher />
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ className="hidden text-muted-foreground hover:text-foreground sm:flex">
                <CircleHelp className="h-3.5 w-3.5 text-foreground-muted" />
                <span className="sr-only">Block description</span>
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_
                side="bottom"
                align="end"
                sideOffset={6}
                className="space-y-3 rounded-[0.5rem] text-xs"
              >
                <p className="font-medium">
                  What is the difference between the New York and Default style?
                </p>
                <p>A style comes with its own set of components, animations, icons and more.</p>
                <p>
                  The <span className="font-medium">Default</span> style has larger inputs, uses
                  lucide-react for icons and tailwindcss-animate for animations.
                </p>
                <p>
                  The <span className="font-medium">New York</span> style ships with smaller buttons
                  and inputs. It also uses shadows on cards and buttons.
                </p>
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
            <Separator orientation="vertical" className="mx-2 h-4" />
            {/* <BlockCopyCodeButton name={block.name} code={block.code} /> */}
            {/* <V0Button
              name={block.name}
              description={block.description || 'Edit in v0'}
              code={block.code}
              style={block.style}
            /> */}
          </div>
        )}
      </div>
      <TabsContent_Shadcn_
        value="preview"
        className="relative after:absolute after:inset-0 after:right-3 after:z-0 after:rounded-lg after:bg-muted"
      >
        <ResizablePanelGroup direction="horizontal" className="relative z-10">
          <ResizablePanel
            ref={ref}
            className="relative rounded-lg border bg-background transition-all"
            defaultSize={100}
            minSize={25}
          >
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex h-[--container-height] w-full items-center justify-center gap-2 text-sm text-muted-foreground">
                {/* <Icons.spinner className="h-4 w-4 animate-spin" /> */}
                Loading...
              </div>
            ) : null}
            <iframe
              src={`/docs/block/${block.framework}/${block.name}`}
              height={block.container?.height}
              className="relative z-20 w-full bg-background"
              onLoad={() => {
                setIsLoading(false)
              }}
            />
          </ResizablePanel>
          <ResizableHandle className="relative hidden w-3 bg-transparent p-0 after:absolute after:right-0 after:top-1/2 after:h-8 after:w-[6px] after:-translate-y-1/2 after:translate-x-[-1px] after:rounded-full after:bg-border after:transition-all after:hover:h-10 sm:block" />
          <ResizablePanel defaultSize={0} minSize={0} />
        </ResizablePanelGroup>
      </TabsContent_Shadcn_>
      <TabsContent_Shadcn_ value="code">
        {/* <div
          data-rehype-pretty-code-fragment
          dangerouslySetInnerHTML={{ __html: block.highlightedCode }}
          className="w-full overflow-hidden rounded-md [&_pre]:my-0 [&_pre]:h-[--container-height] [&_pre]:overflow-auto [&_pre]:whitespace-break-spaces [&_pre]:p-6 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed"
        /> */}
        <CodeBlock
          value={`${block.highlightedCode}`}
          language={'jsx'}
          style={{ height: block.container?.height }}
          className="force-render-because-it-wants-a-class-name-string"
        />
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}
