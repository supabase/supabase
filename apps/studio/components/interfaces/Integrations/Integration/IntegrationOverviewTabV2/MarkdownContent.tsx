import { useEffect, useState } from 'react'
import { Markdown } from 'ui-patterns/Markdown'

import { loadIntegrationOverview } from '@/static-data/integrations/overviews'

interface MarkdownContentProps {
  content: string | null | undefined
  integrationId?: string
}

export const MarkdownContent = ({
  content: remoteContent,
  integrationId,
}: MarkdownContentProps) => {
  const [localContent, setLocalContent] = useState<string>('')

  useEffect(() => {
    // Reset on every id/remote change so navigating between integrations
    // doesn't show the previous one's overview while the new import resolves.
    setLocalContent('')

    if (!integrationId || remoteContent) return

    let cancelled = false
    loadIntegrationOverview(integrationId)
      .then((markdown) => {
        if (!cancelled && markdown !== null) setLocalContent(markdown)
      })
      .catch((error) => console.error('Error loading markdown:', error))

    return () => {
      cancelled = true
    }
  }, [integrationId, remoteContent])

  const content = remoteContent || localContent

  return <Markdown className="text-sm">{content}</Markdown>
}
