'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import type { BlockArchitecture } from '@/lib/block-architecture'

const BlockArchitectureDiagram = dynamic(
  () => import('./block-architecture').then((module) => module.BlockArchitectureDiagram),
  {
    loading: () => (
      <div
        role="status"
        className="flex h-full items-center justify-center text-xs text-foreground-lighter"
      >
        Loading architecture overview...
      </div>
    ),
  }
)

export function BlockOverviewTabs({
  architecture,
  children,
  files,
}: {
  architecture: BlockArchitecture
  children?: ReactNode
  files?: ReactNode
}) {
  return (
    <div className="library-block-overview relative z-0 mt-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-44 left-1/2 -z-1 h-[30rem] w-[min(48rem,92vw)] [transform:translateX(-50%)] animate-[library-celestial-drift_8s_ease-in-out_infinite] bg-[radial-gradient(ellipse_at_30%_54%,oklch(0.72_0.17_245_/_0.22),transparent_43%),radial-gradient(ellipse_at_50%_42%,oklch(0.76_0.16_155_/_0.18),transparent_40%),radial-gradient(ellipse_at_68%_52%,oklch(0.7_0.18_325_/_0.2),transparent_43%),radial-gradient(ellipse_at_52%_70%,oklch(0.78_0.14_75_/_0.12),transparent_48%)] [filter:blur(34px)_saturate(115%)] motion-reduce:animate-none"
      />
      <Tabs
        defaultValue={children ? 'preview' : 'architecture'}
        className="relative z-10 overflow-hidden rounded-xl border bg-background"
      >
        <TabsList aria-label="Block overview" className="gap-0 bg-muted px-3">
          {children && (
            <TabsTrigger
              value="preview"
              className="px-3 py-3 text-xs data-[state=active]:border-brand"
            >
              Preview
            </TabsTrigger>
          )}
          <TabsTrigger
            value="architecture"
            className="px-3 py-3 text-xs data-[state=active]:border-brand"
          >
            What&apos;s added
          </TabsTrigger>
          {files && (
            <TabsTrigger
              value="files"
              className="px-3 py-3 text-xs data-[state=active]:border-brand"
            >
              Files
            </TabsTrigger>
          )}
        </TabsList>
        {children && (
          <TabsContent
            value="preview"
            forceMount
            className="library-overview-preview mt-0 data-[state=inactive]:hidden"
          >
            {children}
          </TabsContent>
        )}
        <TabsContent value="architecture" className="mt-0 h-[520px] md:h-[600px]">
          <BlockArchitectureDiagram architecture={architecture} />
        </TabsContent>
        {files && (
          <TabsContent value="files" className="mt-0 h-[520px] md:h-[600px]">
            {files}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
