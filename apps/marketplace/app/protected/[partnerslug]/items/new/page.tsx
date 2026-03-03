import { notFound } from 'next/navigation'

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
    <ItemEditorSplitView
      mode="create"
      partner={{ id: partner.id, slug: partner.slug, title: partner.title }}
    />
  )
}
