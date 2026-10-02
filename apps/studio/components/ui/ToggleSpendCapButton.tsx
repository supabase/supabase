import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { Button } from 'ui'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface ToggleSpendCapButtonProps {
  action?: 'disable' | 'enable'
  variant?: 'default' | 'primary'
}

export const ToggleSpendCapButton = ({
  action = 'disable',
  variant = 'default',
  children,
}: PropsWithChildren<ToggleSpendCapButtonProps>) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug ?? '_'

  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const subject = `Enquiry to ${action} spend cap for organization`
  const message = `Name: ${organization?.name}\nSlug: ${organization?.slug}`

  const href = billingAll ? `/org/${slug}/billing?panel=costControl` : ''
  const linkChildren = children || `${action} spend cap`
  const link = billingAll ? (
    <Link href={href} className="capitalize">
      {linkChildren}
    </Link>
  ) : (
    <SupportLink queryParams={{ orgSlug: slug, category: 'Plan_upgrade', subject, message }}>
      {linkChildren}
    </SupportLink>
  )

  return (
    <Button variant={variant} asChild>
      {link}
    </Button>
  )
}
