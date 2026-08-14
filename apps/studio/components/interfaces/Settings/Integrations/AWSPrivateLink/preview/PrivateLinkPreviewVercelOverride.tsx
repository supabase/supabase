/**
 * Prototype-only Vercel card overrides. Not a fake Vercel dashboard.
 */

import SVG from 'react-inlinesvg'
import { Card, CardContent, CardFooter, Input } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

import { usePrivateLinkPreview } from './privateLinkPreview.store'
import { BASE_PATH } from '@/lib/constants'

function VercelProjectField() {
  return (
    <FormLayout
      layout="flex-row-reverse"
      label="Vercel project"
      description="Managed via Vercel Marketplace"
    >
      <div className="relative w-full md:w-64">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SVG
            src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
            title="Vercel icon"
            className="w-3.5 shrink-0 text-foreground-muted"
          />
        </span>
        <Input readOnly value="acme-app" className="pl-9" onFocus={(e) => e.target.blur()} />
      </div>
    </FormLayout>
  )
}

function MarketplaceVercelCard() {
  return (
    <Card>
      <CardContent>
        <VercelProjectField />
      </CardContent>
    </Card>
  )
}

function MarketplacePlusVercelCard() {
  return (
    <Card>
      <CardContent>
        <VercelProjectField />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-foreground-lighter">
          Private database path is in AWS PrivateLink below.
        </p>
      </CardFooter>
    </Card>
  )
}

export const PrivateLinkPreviewVercelOverride = () => {
  const { vercelCard } = usePrivateLinkPreview()

  if (vercelCard === 'marketplace') return <MarketplaceVercelCard />

  if (vercelCard === 'marketplace-plus' || vercelCard === 'distinguish-billing') {
    return <MarketplacePlusVercelCard />
  }

  return null
}
