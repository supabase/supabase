import { IS_PLATFORM, useFeatureFlags, useFlag } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { PasskeysSettingsForm } from '@/components/interfaces/Auth/Passkeys/PasskeysSettingsForm'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const PasskeysPage: NextPageWithLayout = () => {
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const isPasskeyAuthEnabled = useFlag('enablePasskeyAuth')

  const isResolvingPasskeyFlag = IS_PLATFORM && !flagsLoaded

  if (isResolvingPasskeyFlag) {
    return (
      <>
        <PageHeader size="default">
          <PageHeaderMeta>
            <HeaderSummary />
          </PageHeaderMeta>
        </PageHeader>
        <PageContainer size="default">
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      </>
    )
  }

  if (!isPasskeyAuthEnabled) {
    return (
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            <p className="text-sm text-foreground-light">
              Passkey authentication is not available for this project.
            </p>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <HeaderSummary />
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            <PasskeysSettingsForm />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

const HeaderSummary = () => {
  return (
    <PageHeaderSummary>
      <PageHeaderTitle>Passkeys</PageHeaderTitle>
      <PageHeaderDescription>
        Configure WebAuthn passkeys so users can sign in with biometrics, security keys, or platform
        authenticators
      </PageHeaderDescription>
    </PageHeaderSummary>
  )
}

PasskeysPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout title="Passkeys">{page}</AuthLayout>
  </DefaultLayout>
)

export default PasskeysPage
