'use client'

import { ExternalLink } from 'lucide-react'
import { cn } from 'ui'
import { CodeBlock } from 'ui/src/components/CodeBlock'
import type { McpClient, McpClientConfig } from '../types'

interface McpConfigurationDisplayProps {
  selectedClient: McpClient
  clientConfig: McpClientConfig
  className?: string
}

export function McpConfigurationDisplay({
  selectedClient,
  clientConfig,
  className,
}: McpConfigurationDisplayProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {selectedClient.configFile && (
        <div className="text-xs text-foreground-light">
          Add this configuration to{' '}
          <code className="px-1 py-0.5 bg-surface-200 rounded">{selectedClient.configFile}</code>:
        </div>
      )}

      <CodeBlock
        value={JSON.stringify(clientConfig, null, 2)}
        language="json"
        className="max-h-64 overflow-y-auto"
      />

      {selectedClient.alternateInstructions && selectedClient.alternateInstructions(clientConfig)}

      {(selectedClient.docsUrl || selectedClient.externalDocsUrl) && (
        <div className="flex items-center gap-2 text-xs text-foreground-light">
          <span>Need help?</span>
          {selectedClient.docsUrl && (
            <a
              href={selectedClient.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline inline-flex items-center"
            >
              View setup guide
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
          {selectedClient.externalDocsUrl && (
            <a
              href={selectedClient.externalDocsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline inline-flex items-center"
            >
              View {selectedClient.label} docs
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
