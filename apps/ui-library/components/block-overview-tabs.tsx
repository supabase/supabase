'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

export function BlockOverviewTabs({
  children,
  files,
}: {
  children?: ReactNode
  files?: ReactNode
}) {
  return (
    <div className="library-block-overview relative z-0 mt-4">
      <Tabs
        defaultValue={children ? 'preview' : 'files'}
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
        {files && (
          <TabsContent value="files" className="mt-0 h-[520px] md:h-[600px]">
            {files}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
