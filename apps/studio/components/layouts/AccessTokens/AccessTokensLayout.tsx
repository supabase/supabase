import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useFlag } from 'common'

const AccessTokensLayout = ({ children }: PropsWithChildren) => {
  const scopedTokensEnabled = useFlag('scopedPAT')

  const navigationItems = [
    {
      label: 'Classic Tokens',
      href: `/account/tokens`,
      id: 'classic-tokens',
    },
    ...(scopedTokensEnabled
      ? [
          {
            label: 'Scoped Tokens',
            href: `/account/tokens/scoped`,
            id: 'scoped-tokens',
          },
        ]
      : []),
  ]

  return (
    <PageLayout
      title="Access Tokens"
      navigationItems={navigationItems}
      className="first:[&>div]:pt-0"
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default AccessTokensLayout
