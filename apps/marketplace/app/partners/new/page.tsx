import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { getMarketplaceSidebarData } from '@/lib/marketplace/server'
import { NewPartnerForm } from './new-partner-form'

export default async function NewPartnerPage() {
  const { user, partners } = await getMarketplaceSidebarData()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <main className="fixed inset-0 z-50 bg-background">
      <div className="flex h-full flex-col overflow-y-auto">
        <PageHeader size="default" className="shrink-0">
          {partners.length > 0 ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/protected/${partners[0].slug}`}>Back</Link>
            </Button>
          ) : null}
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Create your partner</PageHeaderTitle>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>
        <PageContainer size="default" className="flex-1 py-8">
          <PageSection className="mx-auto w-full max-w-3xl py-0">
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Create your partner</PageSectionTitle>
                <p className="text-sm text-muted-foreground">
                  You need a partner before you can manage marketplace items.
                </p>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              <NewPartnerForm />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      </div>
    </main>
  )
}
