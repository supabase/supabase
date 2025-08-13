import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'

const JWTKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()

  const navigationItems = [
    {
      label: 'Legacy JWT Secret',
      href: `/project/${projectRef}/settings/jwt`,
      id: 'legacy-jwt-keys',
    },
    {
      label: 'JWT Signing Keys',
      href: `/project/${projectRef}/settings/jwt/signing-keys`,
      id: 'signing-keys',
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
