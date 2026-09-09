import { SquareArrowOutUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { getConnectionsAttention, getConnectionsAttentionCopy } from './AWSPrivateLink.utils'
import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'
import { DOCS_URL } from '@/lib/constants'

export function AWSPrivateLinkAttentionAdmonition({
  accounts,
  className,
}: {
  accounts: Array<Pick<AWSAccount, 'status'>> | undefined
  className?: string
}) {
  const copy = getConnectionsAttentionCopy(getConnectionsAttention(accounts))
  if (!copy) return null

  return (
    <Admonition
      type={copy.type}
      layout="responsive"
      title={copy.title}
      description={copy.description}
      className={className}
      actions={
        copy.shouldShowAcceptLink && (
          <Button variant="default" className="w-min" icon={<SquareArrowOutUpRight />} asChild>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`${DOCS_URL}/guides/platform/privatelink#step-2-accept-resource-share`}
            >
              View instructions
            </Link>
          </Button>
        )
      }
    />
  )
}
