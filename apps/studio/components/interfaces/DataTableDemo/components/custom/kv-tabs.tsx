import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { Braces, TableProperties } from 'lucide-react'
import { CopyToClipboardContainer } from './copy-to-clipboard-container'
import { KVTable } from './kv-table'

interface KVTabsProps {
  data: Record<string, string>
  className?: string
}

export function KVTabs({ data, className }: KVTabsProps) {
  return (
    <Tabs defaultValue="table" className={className}>
      <div className="flex items-center justify-end">
        <TabsList className="h-auto gap-1 bg-background px-0 py-0">
          <TabsTrigger
            value="table"
            className="px-0 py-0 text-muted-foreground/70 data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <TableProperties className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger
            value="raw"
            className="px-0 py-0 text-muted-foreground/70 data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <Braces className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="table" className="rounded-md">
        <KVTable data={data} />
      </TabsContent>
      <TabsContent value="raw" asChild>
        {/* REMINDER: either `overflow-auto whitespace-pre` or `whitespace-pre-wrap` - depends if we want to wrap the text or not */}
        <CopyToClipboardContainer variant="default" className="overflow-auto whitespace-pre">
          {JSON.stringify(data, null, 2)}
        </CopyToClipboardContainer>
      </TabsContent>
    </Tabs>
  )
}
