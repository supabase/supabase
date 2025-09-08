import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'

const JWTKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const { projectSettingsLegacyJwtKeys } = useIsFeatureEnabled(['project_settings:legacy_jwt_keys'])

  const navigationItems = [
    ...(projectSettingsLegacyJwtKeys
      ? [
          {
            label: 'Legacy JWT Secret',
            href: `/project/${projectRef}/settings/jwt`,
            id: 'legacy-jwt-keys',
          },
        ]
      : []),
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
