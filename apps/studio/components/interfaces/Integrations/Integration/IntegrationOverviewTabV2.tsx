import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'

import { useAvailableIntegrations } from '../Landing/useAvailableIntegrations'
import { InlineLinkClassName } from '@/components/ui/InlineLink'

/**
 * [Joshen] This will serve as the overview tab for remotely fetched integrations
 */
export const IntegrationOverviewTabV2 = () => {
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
