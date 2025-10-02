import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'

interface ToggleSpendCapButtonProps {
  action?: 'disable' | 'enable'
  type?: 'default' | 'primary'
}

export const ToggleSpendCapButton = ({
  action = 'disable',
  type = 'default',
  children,
}: PropsWithChildren<ToggleSpendCapButtonProps>) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug ?? '_'

  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const subject = `Enquiry to ${action} spend cap for organization`
  const message = `Name: ${organization?.name}\nSlug: ${organization?.slug}`

  const href = billingAll
    ? `/org/${slug}/billing?panel=costControl`
    : `/support/new?slug=${slug}&projectRef=no-project&category=Plan_upgrade&subject=${subject}&message=${encodeURIComponent(message)}`

  return (
    <Button type={type} asChild>
      <Link href={href} className="capitalize">
        {children || `${action} spend cap`}
      </Link>
    </Button>
  )
}
