import { createFileRoute } from '@tanstack/react-router'
import { Admonition } from 'ui-patterns/Admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { RealtimeSettings } from '@/components/interfaces/Realtime/RealtimeSettings'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/realtime/settings')({
  component: RealtimeSettingsPage,
  staticData: {
    realtimeLayoutTitle: 'Realtime Settings',
  },
})

function RealtimeSettingsPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Realtime Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Configure your project's Realtime settings
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/realtime/settings`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer>
        <PageSection>
          <PageSectionContent>
            {!IS_PLATFORM ? (
              <Admonition
                type="default"
                title="Realtime settings are not available for self-hosted projects"
                description="Realtime settings are only available for Supabase Platform projects."
              />
            ) : (
              <RealtimeSettings />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
