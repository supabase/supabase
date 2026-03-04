import { Badge } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { CustomAuthProvidersList } from './CustomAuthProvidersList'

export const CustomAuthProviders = () => {
  return (
    <PageSection id="custom-providers">
      <PageSectionMeta>
        <PageSectionSummary>
          <div className="flex items-center gap-x-2">
            <PageSectionTitle>Custom Providers</PageSectionTitle>
            <Badge variant="success">New</Badge>
          </div>
          <PageSectionDescription>
            Configure OAuth/OIDC providers for this project using your own issuer or endpoints.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <CustomAuthProvidersList />
      </PageSectionContent>
    </PageSection>
  )
}
