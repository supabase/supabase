import { Database } from '../lib/database.types'

type DbPartner = Database['public']['Tables']['partners']['Row']

export type Category = {
  name: string
  slug: string
}

export type Partner = {
  categories: Category[]
  featured: boolean
  type: 'technology' | 'expert'
  slug: string
  title: string
  partnerName: string
  description: string
  websiteUrl: string
  docsUrl: string | null
  installUrl: string | null
  logo: string
  images: string[]
  youtubeId: string | null
}

export function toPartner(dbPartner: DbPartner): Partner {
  const {
    featured,
    slug,
    type,
    title,
    developer,
    description,
    website,
    docs,
    logo,
    category,
    images,
    call_to_action_link,
    video,
  } = dbPartner
  return {
    categories: [{ name: category, slug: category.toLowerCase() }],
    featured: featured ?? false,
    type,
    slug,
    title,
    partnerName: developer,
    description,
    websiteUrl: website,
    docsUrl: docs,
    installUrl: call_to_action_link,
    logo: logo,
    images: images ?? [],
    youtubeId: video,
  }
}
