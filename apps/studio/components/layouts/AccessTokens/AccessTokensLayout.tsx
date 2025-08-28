import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

// import { useParams } from 'common'

const AccessTokensLayout = ({ children }: PropsWithChildren) => {
  // const { ref: projectRef } = useParams()

  const navigationItems = [
    {
      label: 'Classic Tokens',
      href: `/account/tokens`,
      id: 'classic-tokens',
    },
    {
      label: 'Scoped Tokens',
      href: `/account/tokens/scoped`,
      id: 'scoped-tokens',
    },
  ]

  return (
    <PageLayout title="Access Tokens" navigationItems={navigationItems}>
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default AccessTokensLayout
