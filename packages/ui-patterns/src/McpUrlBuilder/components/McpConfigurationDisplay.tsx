'use client'

import { stringify as stringifyToml } from '@std/toml/stringify'
import yaml from 'js-yaml'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Button, cn } from 'ui'
import { CodeBlock, type CodeBlockLang } from 'ui/src/components/CodeBlock'

import type { McpClient, McpClientConfig, McpOnCopyCallback } from '../types'
import { getMcpButtonData } from '../utils/getMcpButtonData'

interface McpConfigurationDisplayProps {
  selectedClient: McpClient
  clientConfig: McpClientConfig
  className?: string
  theme?: 'light' | 'dark'
  basePath: string
  onCopyCallback: (type?: McpOnCopyCallback) => void
  onInstallCallback?: () => void
  isPlatform?: boolean
}

type ConfigFormat = CodeBlockLang | 'toml'

export function McpConfigurationDisplay({
  selectedClient,
  clientConfig,
  className,
  theme = 'dark',
  basePath,
  onCopyCallback,
  onInstallCallback,
  isPlatform,
}: McpConfigurationDisplayProps) {
  const mcpButtonData = getMcpButtonData({
    basePath,
    theme,
    client: selectedClient,
    clientConfig,
    isPlatform,
  })

  // Extract file extension and determine format
  const fileExtension = selectedClient.configFile?.split('.').pop()?.toLowerCase()
  // If the file extension is not 'json', 'yaml', or 'toml', default to 'txt'
  let configFormat: ConfigFormat | undefined
  if (['json', 'yaml', 'toml'].includes(fileExtension ?? '')) {
    configFormat = fileExtension as ConfigFormat
  }

  // Serialize config based on format
  let configValue: string
  switch (configFormat) {
    case 'yaml':
      configValue = yaml.dump(clientConfig, { indent: 2, lineWidth: -1 })
      break
    case 'toml':
      configValue = stringifyToml(clientConfig as Record<string, any>).trim()
      break
    case 'json':
      configValue = JSON.stringify(clientConfig, null, 2)
      break
    default:
      configValue = String(clientConfig)
  }

  // Toml will default to undefined display language
  const displayLanguage: CodeBlockLang | undefined =
    configFormat === 'toml' ? undefined : configFormat

  return (
    <div className={cn('space-y-4', className)}>
      {mcpButtonData && (
        <>
          <div className="text-xs text-foreground-light">
            {selectedClient.deepLinkDescription ?? 'Install in one click:'}
          </div>
          <Button type="secondary" size="small" asChild>
            <a
              href={mcpButtonData.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2"
              onClick={onInstallCallback}
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

      {selectedClient.primaryInstructions &&
        selectedClient.primaryInstructions(clientConfig, onCopyCallback, { isPlatform })}

      {selectedClient.configFile && (
        <>
          <div className="text-xs text-foreground-light">
            {selectedClient.primaryInstructions
              ? 'Alternatively, add'
              : mcpButtonData
                ? 'Or add'
                : 'Add'}{' '}
            this configuration to{' '}
            <code className="px-1 py-0.5 bg-surface-200 rounded">{selectedClient.configFile}</code>:
          </div>
          <CodeBlock
            value={configValue}
            language={displayLanguage}
            className="max-h-64 overflow-y-auto"
            focusable={false}
            onCopyCallback={() => onCopyCallback?.('config')}
          />
        </>
      )}

      {selectedClient.alternateInstructions &&
        selectedClient.alternateInstructions(clientConfig, onCopyCallback, { isPlatform })}

      {(selectedClient.docsUrl || selectedClient.externalDocsUrl) && (
        <div className="flex items-center gap-2 text-xs text-foreground-light">
          <span>Need help?</span>
          {selectedClient.docsUrl && (
            <a
              href={selectedClient.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-link hover:underline inline-flex items-center"
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
              className="text-brand-link hover:underline inline-flex items-center"
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
