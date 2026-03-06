import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
} from 'ui'
import {
  PageHeader,
  PageHeaderBreadcrumb,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { ItemEditorSplitView } from '@/components/item-editor-split-view'
import { createClient } from '@/lib/supabase/server'

type NewItemPageProps = {
  params: {
    partnerslug: string
  }
}

export default async function NewItemPage({ params }: NewItemPageProps) {
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
    <div className="flex h-full min-h-full min-w-0 flex-col">
      <PageHeader size="full" className="border-b pb-6 [&>div]:px-6 [&>div]:xl:px-6">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/protected/${partner.slug}/items`}>Items</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create item</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Create item</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <div className="min-h-0 flex-1">
        <ItemEditorSplitView
          mode="create"
          partner={{ id: partner.id, slug: partner.slug, title: partner.title }}
        />
      </div>
    </div>
  )
}
