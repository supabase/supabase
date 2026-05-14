import { useParams } from 'common'

import { InlineLink } from '@/components/ui/InlineLink'

export const MarketplacePreview = () => {
  const { ref } = useParams()

  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Browse and install integrations from a unified Marketplace. The new layout brings native
        Supabase features, Postgres modules, wrappers, and third-party partner apps together in one
        place, with filtering by category and install mechanism, a featured-partners showcase, and a
        consistent detail view for every listing.
      </p>
      <p className="text-sm text-foreground-light mb-4">
        Find it in the dashboard sidebar under{' '}
        <InlineLink href={ref ? `/project/${ref}/integrations` : '/integrations'}>
          Marletplace
        </InlineLink>
        . The sidebar lets you jump between integration types, categories, and your installed apps;
        the index page surfaces featured partners and lets you switch between grid and list views.
      </p>
      <p className="text-sm text-foreground-light">
        This preview is on by default for internal teammates and select integration partners. Turn
        it off here to fall back to the previous Integrations layout at any time.
      </p>
    </div>
  )
}
