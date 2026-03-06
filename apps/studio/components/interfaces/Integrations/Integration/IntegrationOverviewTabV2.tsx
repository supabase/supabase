import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { PropsWithChildren, ReactNode } from 'react'
import { Badge, Card, CardContent, cn, Separator } from 'ui'

import { useAvailableIntegrations } from '../Landing/useAvailableIntegrations'
import { InlineLinkClassName } from '@/components/ui/InlineLink'

interface IntegrationOverviewTabProps {
  actions?: ReactNode
  status?: string | ReactNode
}

/**
 * [Joshen] This will serve as the overview tab for remotely fetched integrations
 */
export const IntegrationOverviewTabV2 = ({
  status,
  children,
}: PropsWithChildren<IntegrationOverviewTabProps>) => {
  const { id } = useParams()

  const { data: allIntegrations } = useAvailableIntegrations()
  const integration = allIntegrations.find((i) => i.id === id)

  if (!integration) {
    return <div>Unsupported integration type</div>
  }

  const { type, content, docsUrl, siteUrl } = integration

  const docsUrlLabel = docsUrl?.includes('supabase.com/docs')
    ? 'Supabase Docs'
    : docsUrl?.includes('github.com')
      ? 'GitHub Docs'
      : 'Documentation'
  const siteUrlLabel = !!siteUrl ? new URL(siteUrl).origin : undefined

  return (
    <div className="grid grid-cols-3 gap-x-8 px-10 py-8">
      <div className="col-span-2 flex-grow">
        <Markdown className="flex flex-col gap-y-2">{content}</Markdown>
      </div>

      <div className="text-sm col-span-1 flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-4">
          <p>Details</p>

          <div className="flex flex-col gap-y-1">
            <p className="font-mono uppercase text-foreground-light">Type</p>
            <p className="capitalize">{type === 'oauth' ? 'OAuth' : type}</p>
          </div>

          <div className="flex flex-col gap-y-1">
            <p className="font-mono uppercase text-foreground-light">Built by</p>
            <p>{integration.author.name || 'Unknown Author'}</p>
          </div>

          {docsUrl && (
            <div className="flex flex-col gap-y-1">
              <p className="font-mono uppercase text-foreground-light">Docs</p>
              <a target="_blank" rel="noreferrer" href={docsUrl} className={InlineLinkClassName}>
                {docsUrlLabel}
              </a>
            </div>
          )}

          {siteUrl && (
            <div className="flex flex-col gap-y-1">
              <p className="font-mono uppercase text-foreground-light">Website</p>
              <a target="_blank" rel="noreferrer" href={siteUrl} className={InlineLinkClassName}>
                {siteUrlLabel}
              </a>
            </div>
          )}
        </div>

        {/* Subsequent sections here */}
      </div>
    </div>
  )
}
