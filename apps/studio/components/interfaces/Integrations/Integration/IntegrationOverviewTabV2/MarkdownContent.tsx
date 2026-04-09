import { useEffect, useState } from 'react'

import { Markdown } from '@/components/interfaces/Markdown'

interface MarkdownContentProps {
  content: string | null | undefined
  integrationId?: string
}

export const MarkdownContent = ({
  content: remoteContent,
  integrationId,
}: MarkdownContentProps) => {
  const [localContent, setLocalContent] = useState<string>('')

  const content = remoteContent || localContent

  useEffect(() => {
    if (!!integrationId && !content) {
      import(`@/static-data/integrations/${integrationId}/overview.md`)
        .then((module) => setLocalContent(String(module.default)))
        .catch((error) => console.error('Error loading markdown:', error))
    }
  }, [integrationId, content])

  return <Markdown className="flex flex-col gap-y-4 text-foreground-light">{content}</Markdown>
}
