import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'

import { BASE_PATH } from '@/lib/constants'

const AWS_MARKETPLACE_URL = 'https://supabase.com/aws-marketplace'

export function AwsMarketplacePurchaseCallout() {
  return (
    <section className="flex flex-col gap-3 rounded-md border bg-surface-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-surface-100">
          <img
            alt=""
            aria-hidden="true"
            src={`${BASE_PATH}/img/icons/aws-icon.svg`}
            className="size-5"
          />
        </div>
        <div className="max-w-2xl">
          <h2 className="text-sm font-medium">Purchase through AWS Marketplace</h2>
          <p className="text-sm text-foreground-light">
            Apply Supabase spend toward an AWS commitment and manage billing through AWS.
          </p>
        </div>
      </div>
      <Button asChild className="shrink-0 self-start sm:self-auto" iconRight={<ExternalLink />}>
        <a href={AWS_MARKETPLACE_URL} target="_blank" rel="noreferrer">
          View purchase options
        </a>
      </Button>
    </section>
  )
}
