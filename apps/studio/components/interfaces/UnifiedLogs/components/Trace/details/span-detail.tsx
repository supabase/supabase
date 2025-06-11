import { ArrowRight, Clock, X } from 'lucide-react'
import {
  Button,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

interface Span {
  id: string
  name: string
  startTime: number
  endTime: number
  level: number
  highlight?: boolean
}

interface SpanDetailProps {
  span: Span
  onClose: () => void
}

export function SpanDetail({ span, onClose }: SpanDetailProps) {
  const duration = span.endTime - span.startTime

  return (
    <div className="p-4 bg-black text-white w-96 border-l">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg mb-2 truncate">{span.name}</h3>
        <Button type="text" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
        <Clock className="h-4 w-4" />
        <span>{span.startTime.toFixed(2)}ms</span>
        <ArrowRight className="h-3 w-3" />
        <span>{span.endTime.toFixed(2)}ms</span>
        <span className="font-medium text-white">({duration.toFixed(2)}ms)</span>
      </div>

      <Tabs defaultValue="details" className="text-white">
        <TabsList className="grid grid-cols-4 mb-4 bg-neutral-900">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="source">Source</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="border border-neutral-800 rounded-md p-3 bg-neutral-900">
            <h4 className="font-medium text-sm mb-2">Span Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-neutral-500">ID</div>
              <div>{span.id}</div>
              <div className="text-neutral-500">Name</div>
              <div>{span.name}</div>
              <div className="text-neutral-500">Start Time</div>
              <div>{span.startTime.toFixed(2)}ms</div>
              <div className="text-neutral-500">End Time</div>
              <div>{span.endTime.toFixed(2)}ms</div>
              <div className="text-neutral-500">Duration</div>
              <div>{duration.toFixed(2)}ms</div>
            </div>
          </div>

          <div className="border border-neutral-800 rounded-md p-3">
            <h4 className="font-medium text-sm mb-2">Attributes</h4>
            <div className="text-sm text-neutral-500 italic">No attributes available</div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="border border-neutral-800 rounded-md p-3 h-64 overflow-y-auto">
            <div className="text-sm text-neutral-500 italic">No logs available for this span</div>
          </div>
        </TabsContent>

        <TabsContent value="network">
          <div className="border border-neutral-800 rounded-md p-3 h-64 overflow-y-auto">
            <div className="text-sm text-neutral-500 italic">No network requests for this span</div>
          </div>
        </TabsContent>

        <TabsContent value="source">
          <div className="border border-neutral-800 rounded-md p-3 bg-neutral-900 font-mono text-sm h-64 overflow-y-auto">
            <pre className="text-xs">
              {`// Sample source code
function processRequest(req, res) {
  // Start span
  const span = tracer.startSpan('${span.name}');
  
  try {
    // Process request
    const result = await handleRequest(req);
    
    // End span
    span.end();
    
    return result;
  } catch (error) {
    // Record error
    span.recordException(error);
    span.end();
    throw error;
  }
}`}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
