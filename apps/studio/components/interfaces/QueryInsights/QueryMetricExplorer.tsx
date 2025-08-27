import {
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Card,
  CardContent,
  CardHeader,
} from 'ui'
import { QueryRowExplorer } from './QueryRowExplorer'

export const QueryMetricExplorer = () => {
  return (
    <div className="w-full">
      <Card>
        <Tabs_Shadcn_ defaultValue="latency" className="w-full">
          <CardHeader className="h-10 py-0 pl-4 pr-2 flex flex-row items-center justify-between flex-0">
            <TabsList_Shadcn_ className="flex justify-start rounded-none gap-x-4 border-b-0 !mt-0 pt-0">
              <TabsTrigger_Shadcn_
                value="latency"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Query latency
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="rows"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Rows read
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="calls"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Calls
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="cache"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Cache hits
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
          </CardHeader>

          <CardContent className="!p-0 mt-0 flex-1">
            <TabsContent_Shadcn_ value="latency" className="bg-surface-100 mt-0">
              <div className="h-96 flex items-center justify-center w-full">Latency</div>
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="rows" className="bg-surface-100 mt-0">
              <div className="h-96 flex items-center justify-center w-full">Rows</div>
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="calls" className="bg-surface-100 mt-0">
              <div className="h-96 flex items-center justify-center w-full">Calls</div>
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="cache" className="bg-surface-100 mt-0">
              <div className="h-96 flex items-center justify-center w-full">Cache hits</div>
            </TabsContent_Shadcn_>
          </CardContent>
        </Tabs_Shadcn_>
        <QueryRowExplorer />
      </Card>
    </div>
  )
}
