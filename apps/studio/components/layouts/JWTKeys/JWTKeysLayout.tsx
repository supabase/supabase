import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'

const JWTKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()

  const navigationItems = [
    {
      label: 'JWT Signing Keys',
      href: `/project/${projectRef}/auth/jwt`,
      id: 'signing-keys',
    },
    {
      label: 'Legacy JWT Secret',
      href: `/project/${projectRef}/auth/jwt/legacy`,
      id: 'legacy-jwt-keys',
    },
  ]

  return (
    <PageLayout
      title="JWT Keys"
      subtitle="Control the keys used to sign JSON Web Tokens for your project"
      navigationItems={navigationItems}
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default JWTKeysLayout
