'use client'

import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Button, cn } from 'ui'
import { CodeBlock } from 'ui/src/components/CodeBlock'
import type { McpClient, McpClientConfig } from '../types'
import { getMcpButtonData } from '../utils/getMcpButtonData'

interface McpConfigurationDisplayProps {
  selectedClient: McpClient
  clientConfig: McpClientConfig
  className?: string
  theme?: 'light' | 'dark'
  basePath: string
}

export function McpConfigurationDisplay({
  selectedClient,
  clientConfig,
  className,
  theme = 'dark',
  basePath,
}: McpConfigurationDisplayProps) {
  const mcpButtonData = getMcpButtonData({
    basePath,
    theme,
    client: selectedClient,
    clientConfig,
  })

  return (
    <div className={cn('space-y-4', className)}>
      {mcpButtonData && (
        <>
          <div className="text-xs text-foreground-light">Install in one click:</div>
          <Button type="secondary" size="small" asChild>
            <a
              href={mcpButtonData.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2"
            >
              <Image
                src={mcpButtonData.imageSrc}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              Add to {selectedClient.label}
            </a>
          </Button>
        </>
      )}

      {selectedClient.configFile && (
        <div className="text-xs text-foreground-light">
          {mcpButtonData ? 'Or add' : 'Add'} this configuration to{' '}
          <code className="px-1 py-0.5 bg-surface-200 rounded">{selectedClient.configFile}</code>:
        </div>
      )}

      <CodeBlock
        value={JSON.stringify(clientConfig, null, 2)}
        language="json"
        className="max-h-64 overflow-y-auto"
        focusable={false}
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
