import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Partner } from '~/types/partners'

const PARTNERS_DIRECTORY = '_partners'

export interface PartnerFrontmatter {
  slug: string
  title: string
  type: 'technology' | 'expert'
  category: string
  developer: string
  description: string
  logo: string
  website: string
  featured: boolean
  docs?: string
  video?: string
  call_to_action_link?: string
  images?: string[]
}

export interface PartnerWithContent extends PartnerFrontmatter {
  content: string
}

/**
 * Get all partners from MDX files
 */
export function getAllPartners(type?: 'technology' | 'expert'): Partner[] {
  const partnersDirectory = path.join(process.cwd(), PARTNERS_DIRECTORY)

  if (!fs.existsSync(partnersDirectory)) {
    console.warn(`Partners directory not found: ${partnersDirectory}`)
    return []
  }

  const fileNames = fs.readdirSync(partnersDirectory)

  const allPartners = fileNames
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => {
      const slug = filename.replace('.mdx', '')
      const fullPath = path.join(partnersDirectory, filename)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)

      return {
        slug,
        ...data,
        // Ensure required fields have defaults
        approved: true,
        id: 0, // Not used but required by type
        contact: 0, // Not used but required by type
        created_at: '',
        tsv: null,
        overview: '', // We don't need overview for list view
      } as Partner
    })

  // Filter by type if specified
  let filteredPartners = allPartners
  if (type) {
    filteredPartners = allPartners.filter((p) => p.type === type)
  }

  // Sort by category then title
  return filteredPartners.sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category)
    if (categoryCompare !== 0) return categoryCompare
    return a.title.localeCompare(b.title)
  })
}

/**
 * Get all partner slugs for static paths
 */
export function getAllPartnerSlugs(type?: 'technology' | 'expert'): string[] {
  const partners = getAllPartners(type)
  return partners.map((p) => p.slug)
}

/**
 * Get a single partner by slug with full content
 */
export function getPartnerBySlug(slug: string): PartnerWithContent | null {
  const partnersDirectory = path.join(process.cwd(), PARTNERS_DIRECTORY)
  const fullPath = path.join(partnersDirectory, `${slug}.mdx`)

  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    slug,
    ...data,
    content,
  } as PartnerWithContent
}

/**
 * Get partner data formatted for the Partner type (for detail pages)
 */
export function getPartnerData(slug: string): Partner | null {
  const partner = getPartnerBySlug(slug)

  if (!partner) {
    return null
  }

  return {
    id: 0,
    slug: partner.slug,
    type: partner.type,
    category: partner.category,
    developer: partner.developer,
    title: partner.title,
    description: partner.description,
    logo: partner.logo,
    images: partner.images || null,
    overview: partner.content,
    website: partner.website,
    docs: partner.docs || null,
    contact: 0,
    approved: true,
    created_at: '',
    tsv: null,
    video: partner.video || null,
    call_to_action_link: partner.call_to_action_link || null,
    featured: partner.featured || false,
  }
}

/**
 * Search partners by text (simple search for now)
 */
export function searchPartners(
  query: string,
  type?: 'technology' | 'expert'
): Partner[] {
  const allPartners = getAllPartners(type)
  
  if (!query.trim()) {
    return allPartners
  }

  const lowerQuery = query.toLowerCase().trim()
  
  return allPartners.filter((partner) => {
    return (
      partner.title.toLowerCase().includes(lowerQuery) ||
      partner.description.toLowerCase().includes(lowerQuery) ||
      partner.category.toLowerCase().includes(lowerQuery) ||
      partner.developer.toLowerCase().includes(lowerQuery)
    )
  })
}

