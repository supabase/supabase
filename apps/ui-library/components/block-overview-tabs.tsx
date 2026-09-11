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
      <Tabs
        defaultValue={children ? 'preview' : 'architecture'}
        className="overflow-hidden rounded-xl border bg-muted/50"
      >
        <TabsList aria-label="Block overview" className="gap-0 px-3">
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
