export interface KbSearchRow {
  slug: string
  page_title: string
  heading: string
  heading_level: number
  heading_path: string[]
  excerpt: string
  score: number
}

export interface KbSearchResult {
  title: string
  href: string
  heading: string
  headingPath: string[]
  excerpt: string
  score: number
  content?: string | null
}

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: {
      search_kb: {
        Args: { query_text: string; match_limit?: number }
        Returns: KbSearchRow[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
