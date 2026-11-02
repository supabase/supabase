import type { SupabaseClient } from '@supabase/supabase-js'

export interface Section {
  heading: string
  level: number
  headingPath: string[]
  content: string
}

export interface ParsedPage {
  title: string
  excerpt: string
  sections: Section[]
}

export interface SectionRow {
  slug: string
  file_path: string
  page_title: string
  heading: string
  heading_level: number
  heading_path: string[]
  content: string
  excerpt: string
}

export interface IngestOptions {
  supabase: SupabaseClient
  contentRoot: string
  include?: string[]
  ignore?: string[]
  table: string
  slugPrefix?: string
}
