import { type Metadata } from 'next'

import { TroubleshootingHeader, TroubleshootingEntries } from '~/features/docs/Troubleshooting.ui'
import {
  TroubleshootingFilterEmptyState,
  TroubleshootingListController,
} from '~/features/docs/Troubleshooting.ui.client'
import {
  type ITroubleshootingMetadata,
  getTroubleshootingEntriesByTopic,
  getTroubleshootingErrorsByTopic,
  getTroubleshootingKeywordsByTopic,
} from '~/features/docs/Troubleshooting.utils'
import { PROD_URL } from '~/lib/constants'

interface SectionTroubleshootingPageProps {
  topic: ITroubleshootingMetadata['topics'][number]
  sectionName: string
  description?: string
}

export default async function SectionTroubleshootingPage({
  topic,
  sectionName,
  description,
}: SectionTroubleshootingPageProps) {
  // All other fetches are dependent on getTroubleshootingEntriesByTopic, which
  // is cached, so it's run first to populate the cache
  const troubleshootingEntries = await getTroubleshootingEntriesByTopic(topic)
  const [keywords, errors] = await Promise.all([
    getTroubleshootingKeywordsByTopic(topic),
    getTroubleshootingErrorsByTopic(topic),
  ])

  const pageTitle = `${sectionName} Troubleshooting`
  const pageDescription =
    description || `Search or browse troubleshooting guides for common ${sectionName} issues.`

  return (
    <div className="flex flex-col">
      <TroubleshootingHeader
        title={pageTitle}
        description={pageDescription}
        keywords={keywords}
        errors={errors}
      />
      <div className="flex-1">
        <div className="px-5 pt-6">
          <TroubleshootingListController />
          <TroubleshootingFilterEmptyState />
          <TroubleshootingEntries name={sectionName} entries={troubleshootingEntries} />
        </div>
      </div>
    </div>
  )
}

export function generateSectionTroubleshootingMetadata(
  topic: string,
  sectionName: string
): Metadata {
  return {
    title: `Supabase Docs | ${sectionName} Troubleshooting`,
    alternates: {
      canonical: `${PROD_URL}/guides/${topic}/troubleshooting`,
    },
  }
}
