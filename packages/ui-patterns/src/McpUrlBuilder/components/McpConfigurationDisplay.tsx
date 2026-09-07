'use client'

import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Button, cn } from 'ui'
import { CodeBlock, type CodeBlockLang } from 'ui-patterns/CodeBlock'

import type { McpClient, McpClientConfig, McpOnCopyCallback } from '../types'
import { getMcpButtonData } from '../utils/getMcpButtonData'
import { serializeMcpConfig } from '../utils/serializeMcpConfig'

interface McpConfigurationDisplayProps {
  selectedClient: McpClient
  clientConfig: McpClientConfig
  className?: string
  theme?: 'light' | 'dark'
  onCopyCallback: (type?: McpOnCopyCallback) => void
  onInstallCallback?: () => void
  isPlatform?: boolean
}

export function McpConfigurationDisplay({
  selectedClient,
  clientConfig,
  className,
  theme = 'dark',
  onCopyCallback,
  onInstallCallback,
  isPlatform,
}: McpConfigurationDisplayProps) {
  const mcpButtonData = getMcpButtonData({
    theme,
    client: selectedClient,
    clientConfig,
    isPlatform,
  })

  const { lang, value: configValue } = serializeMcpConfig(selectedClient.configFile, clientConfig)
  // TOML has no CodeBlock highlighter, so render it without a language.
  const displayLanguage: CodeBlockLang | undefined =
    lang === 'toml' ? undefined : (lang as CodeBlockLang)

  return (
    <div className={cn('space-y-4', className)}>
      {mcpButtonData && (
        <>
          <div className="text-xs text-foreground-light">
            {selectedClient.deepLinkDescription ?? 'Install in one click:'}
          </div>
          <Button variant="secondary" size="small" asChild>
            <a
              href={mcpButtonData.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2"
              onClick={onInstallCallback}
            >
              <Image
                src={mcpButtonData.imageSrc}
                alt={`${selectedClient.label} icon`}
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
            <code className="px-1 py-0.5 bg-surface-200 rounded-sm">
              {selectedClient.configFile}
            </code>
            :
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
