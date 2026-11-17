import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { ConfigurationDriftPage } from '@/components/interfaces/ConfigDrift/ConfigurationDriftPage'

export const Route = createFileRoute('/project/$ref/settings/code-configuration')({
  component: ConfigurationDriftPageEntry,
  staticData: { settingsLayoutTitle: 'Code configuration' },
})

function ConfigurationDriftPageEntry() {
  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Code configuration</PageHeaderTitle>
            <PageHeaderDescription>
              Compare the live project configuration with supabase/config.toml on this branch
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <PageSection>
          <PageSectionContent>
            <ConfigurationDriftPage />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
