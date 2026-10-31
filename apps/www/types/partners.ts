import { Database } from '../lib/database.types'

type DbPartner = Database['public']['Tables']['partners']['Row']

export type Category = {
  name: string
  slug: string
}

export type ListingDetail = {
  slug: string
  label: string
  content: string
  publishedInMarketplace: boolean
  installUrl: string | null
  dashboardUrl?: string | null
  docsUrl: string | null
  images: string[]
  youtubeId: string | null
}

export type Partner = {
  categories: Category[]
  featured: boolean
  publishedInCatalog: boolean
  publishedInMarketplace?: boolean
  type: 'technology' | 'expert'
  slug: string
  title: string
  builtBy: string
  description: string
  content: string
  websiteUrl: string
  docsUrl: string | null
  installUrl: string | null
  logo: string
  images: string[]
  youtubeId: string | null
  listings?: ListingDetail[]
}

export function toPartner(dbPartner: DbPartner): Partner {
  const {
    featured,
    slug,
    type,
    title,
    developer,
    description,
    overview,
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
    publishedInCatalog: false, // has at least one listing shown on the partner catalog page
    publishedInMarketplace: false, // has at least one one-click-installable listing in the dashboard
    type,
    slug,
    title,
    builtBy: developer,
    description,
    content: overview,
    websiteUrl: website,
    docsUrl: docs,
    installUrl: call_to_action_link,
    logo: logo,
    images: images ?? [],
    youtubeId: video,
  }
}
