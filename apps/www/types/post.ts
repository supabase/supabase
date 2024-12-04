type PostTypes = {
  slug?: string
  type: 'casestudy' | 'blog' | 'event'
  title: string
  date: string
  formattedDate?: string
  coverImage?: string
  author?: string
  excerpt?: string
  ogImage?: {
    url: string
  }
  content?: string
  thumb: string
  image?: string
  readingTime?: string
  description: string
  url: string
  path: string
  tags?: string[]
  categories?: string[]
  logo?: string
  logo_inverse?: string
  hideAuthor?: boolean
  end_date?: string // for events that span multiple days (not implemented yet)
  timezone?: string // utc timezone, e.g. 'America/New_York'. Reference: /apps/studio/components/interfaces/Database/Backups/PITR/PITR.constants.ts
  onDemand?: boolean // events that are on-demand following a registration process
  disable_page_build?: boolean // when true, we don't build the page and require a custom link
  link?: {
    href: string
    target?: '_blank' | '_self'
    label?: string
  } // used on event previews to link to a custom event page
}

export default PostTypes
