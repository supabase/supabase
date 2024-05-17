import { type SupabaseClient, createClient } from '@supabase/supabase-js'
import { upperFirst } from 'lodash'

import { BaseLoader, BaseSource } from './base'
import { processMdxForSearch } from './markdown'

type PartnerData = {
  slug: string // The partner slug corresponding to the last part of the URL
  overview: string // The Markdown content for indexing
}

let supabaseClient: SupabaseClient
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_MISC_USE_URL!,
      process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY!
    )
    return supabaseClient
  }
}

export async function fetchPartners() {
  const supabase = getSupabaseClient()
  const { data: partners } = await supabase
    .from('partners')
    .select('slug,overview')
    .eq('approved', true)
    // We want to show technology integrations, not agencies, in search
    .neq('type', 'expert')
  return partners
}

export class IntegrationLoader extends BaseLoader {
  type = 'partner-integration' as const

  constructor(
    source: string,
    public partnerData: PartnerData
  ) {
    const relPath = `/partners/integrations/${partnerData.slug}`
    super(source, relPath)
  }

  async load() {
    return [new IntegrationSource(this.source, this.path, this.partnerData)]
  }
}

export class IntegrationSource extends BaseSource {
  type = 'partner-integration' as const

  constructor(
    source: string,
    path: string,
    public partnerData: PartnerData
  ) {
    super(source, path)
  }

  process() {
    const { checksum, sections } = processMdxForSearch(this.partnerData.overview)
    const meta = {
      title: upperFirst(this.partnerData.slug),
      subtitle: 'Integration',
    }

    this.checksum = checksum
    this.meta = meta
    this.sections = sections

    return {
      checksum,
      meta,
      ragIgnore: true,
      sections,
    }
  }

  extractIndexedContent() {
    const sections = this.sections ?? []
    const result =
      (this.meta?.title ?? '') + '\n\n' + sections.map(({ content }) => content).join('\n\n')
    return result
  }
}
