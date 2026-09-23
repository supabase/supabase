import { Check, Copy, X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  copyToClipboard,
  FloatingPlate,
  ResizableHandle,
  ResizablePanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { AuditLogOverview } from './AuditLogOverview'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

interface AuditLogDetailsPanelProps {
  selectedLog: AuditLog
  onClose: () => void
}

export const AuditLogDetailsPanel = ({ selectedLog, onClose }: AuditLogDetailsPanelProps) => {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(selectedLog, null, 2)

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel id="audit-log-details-panel" defaultSize="33%" minSize={320} maxSize="50%">
        <Tabs defaultValue="overview" className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between px-4 border-b border-border h-[40px]">
            <TabsList className="flex h-auto gap-x-4 rounded-none border-none!">
              <TabsTrigger value="overview" className="border-b py-3 font-mono text-xs uppercase">
                Overview
              </TabsTrigger>
              <TabsTrigger value="raw-json" className="border-b py-3 font-mono text-xs uppercase">
                Raw JSON
              </TabsTrigger>
            </TabsList>
            <Button
              variant="text"
              className="px-1"
              icon={<X />}
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <TabsContent value="overview" className="mt-0 grow overflow-auto py-2">
            <AuditLogOverview selectedLog={selectedLog} />
          </TabsContent>

          <TabsContent
            value="raw-json"
            className="mt-0 grow overflow-auto bg-surface-100/50 relative"
          >
            <div className="sticky top-2 z-10 flex justify-end px-2 -mb-9 pointer-events-none">
              <FloatingPlate className="pointer-events-auto">
                <Button
                  size="tiny"
                  className="px-1.5"
                  icon={copied ? <Check size={12} /> : <Copy size={12} />}
                  onClick={() => {
                    copyToClipboard(json, () => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1000)
                    })
                  }}
                >
                  {copied ? 'Copied' : ''}
                </Button>
              </FloatingPlate>
            </div>
            <CodeBlock
              language="json"
              hideCopy
              wrapperClassName="!overflow-visible bg-surface-100/50 [&_pre]:!bg-surface-100/50"
              className="rounded-none border-none !overflow-x-visible [&_code]:!leading-tight [&_pre]:!leading-tight"
            >
              {json}
            </CodeBlock>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </>
  )
}
