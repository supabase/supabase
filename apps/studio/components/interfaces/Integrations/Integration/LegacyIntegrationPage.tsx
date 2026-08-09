import Link from 'next/link'
import { useMemo } from 'react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  NavMenu,
  NavMenuItem,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { IntegrationLogo } from '@/components/interfaces/Integrations/Integration/IntegrationLogo'
import { InstallOAuthIntegrationButton } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallOAuthIntegrationButton'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { UnknownInterface } from '@/components/ui/UnknownInterface'

const LegacyIntegrationPage = () => {
  const {
    ref,
    id,
    isReady,
    isWrapperBlocked,
    pageTitle,
    pageSubTitle,
    integration,
    isAvailableLoading,
    isInstalledLoading,
    isIntegrationStatusLoading,
    oauthIntegrationData,
    tabs,
    Component,
  } = useIntegrationDetail()

  const content = useMemo(() => {
    if (!isReady || isInstalledLoading || isAvailableLoading) {
      return (
        <PageContainer size="full">
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    } else if (!Component || !id || !integration) {
      return (
        <PageContainer size="full">
          <PageSection>
            <PageSectionContent>
              <Admonition type="warning" title="This integration is not currently available">
                Please try again later or contact support if the problem persists.
              </Admonition>
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    } else {
      return <Component />
    }
  }, [isReady, isInstalledLoading, isAvailableLoading, id, integration, Component])

  if (!isReady) return null
  if (isWrapperBlocked) return <UnknownInterface urlBack={`/project/${ref}/integrations`} />

  return (
    <>
      <PageHeader size="full">
        <PageHeaderBreadcrumb className="mx-auto w-full">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/integrations`}>Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{integration?.name || 'Integration not found'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>

        {isAvailableLoading ? (
          <PageHeaderMeta className="mx-auto w-full">
            <PageHeaderSummary>
              <PageHeaderTitle>
                <ShimmeringLoader className="w-64 py-4" />
              </PageHeaderTitle>
              <PageHeaderDescription>
                <ShimmeringLoader />
              </PageHeaderDescription>
            </PageHeaderSummary>
          </PageHeaderMeta>
        ) : (
          <PageHeaderMeta className="mx-auto w-full">
            {integration && (
              <PageHeaderIcon>
                <IntegrationLogo integration={integration} size="w-14 h-14" />
              </PageHeaderIcon>
            )}
            <PageHeaderSummary className="gap-y-0.5">
              <PageHeaderTitle>{pageTitle}</PageHeaderTitle>
              <PageHeaderDescription>{pageSubTitle}</PageHeaderDescription>
            </PageHeaderSummary>

            {integration?.type === 'oauth' && (
              <InstallOAuthIntegrationButton
                integration={integration}
                data={oauthIntegrationData}
                isLoading={isIntegrationStatusLoading}
              />
            )}
          </PageHeaderMeta>
        )}

        {tabs.length > 0 && (
          <PageHeaderNavigationTabs className="mx-auto w-full">
            <NavMenu>
              {tabs.map((tab) => (
                <NavMenuItem key={tab.href} active={tab.active}>
                  <Link href={tab.href}>{tab.label}</Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </PageHeaderNavigationTabs>
        )}
      </PageHeader>

      <div className="flex-1 min-h-0 mx-auto w-full">{content}</div>
    </>
  )
}

export default LegacyIntegrationPage
