'use client'

import Image from 'next/image'
import { Button } from 'ui'
import type { McpClient, McpClientConfig } from '../types'

interface McpAddToClientButtonProps {
  basePath: string
  theme?: 'light' | 'dark'
  selectedClient: McpClient
  clientConfig: McpClientConfig
}

export function McpAddToClientButton({
  basePath,
  theme = 'dark',
  selectedClient,
  clientConfig,
}: McpAddToClientButtonProps) {
  if (!selectedClient.generateDeepLink) return null

  const deepLink = selectedClient.generateDeepLink(clientConfig)
  if (!deepLink) return null

  return (
    <Button type="secondary" size="small" asChild>
      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2"
      >
        <Image
          src={`${basePath}/img/mcp-clients/${selectedClient.icon}${
            theme === 'dark' ? '-dark' : ''
          }-icon.svg`}
          alt=""
          width={16}
          height={16}
          className="shrink-0"
        />
        Add to {selectedClient.label}
      </a>
    </Button>
  )
}
