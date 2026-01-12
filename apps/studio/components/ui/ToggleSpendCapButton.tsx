import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { SupportLink } from 'components/interfaces/Support/SupportLink'
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
    <Button type={type} asChild>
      {link}
    </Button>
  )
}
