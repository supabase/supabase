import { notFound } from 'next/navigation'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { createClient } from '@/lib/supabase/server'

type PartnerPageProps = {
  params: {
    partnerslug: string
  }
}

export default async function PartnerPage({ params }: PartnerPageProps) {
  const { partnerslug } = params
  const supabase = await createClient()

  const { data: partner, error } = await supabase
    .from('partners')
    .select('id, slug, title')
    .eq('slug', partnerslug)
    .maybeSingle()

  if (error || !partner) {
    notFound()
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{partner.title}</PageHeaderTitle>
            <PageHeaderDescription>{partner.slug}</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Select an item from the sidebar to start editing this partner&apos;s listing.
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
