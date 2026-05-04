import { Database } from '../lib/database.types'

type DbPartner = Database['public']['Tables']['partners']['Row']

export type Category = {
  name: string
  slug: string
}

export type Partner = {
  categories: Category[]
  featured: boolean
  slug: string
  title: string
  description: string
  logoUrl: string
}

export function toPartner(dbPartner: DbPartner): Partner {
  const { featured, slug, title, description, logo, category } = dbPartner
  return {
    categories: [{ name: category, slug: category.toLowerCase() }],
    featured: featured ?? false,
    slug,
    title,
    description,
    logoUrl: logo,
  }
}
