import { useParams } from 'common'

import { InlineLink } from '@/components/ui/InlineLink'

export const PlatformWebhooksPreview = () => {
  const { slug = '_', ref = '_' } = useParams()

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light mb-4">
        Configure webhook endpoints and review deliveries from both project and organization
        settings pages.
      </p>
      <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
        <li>
          Project scope:{' '}
          <InlineLink href={`/project/${ref}/settings/webhooks`}>Project Webhooks</InlineLink>
        </li>
        <li>
          Organization scope:{' '}
          <InlineLink href={`/org/${slug}/webhooks`}>Organization Webhooks</InlineLink>
        </li>
      </ul>
    </div>
  )
}
