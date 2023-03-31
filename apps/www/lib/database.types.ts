export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      partners: {
        Row: {
          id: number
          slug: string
          type: Database['public']['Enums']['partner_type']
          category: string
          developer: string
          title: string
          description: string
          logo: string
          images: string[]
          video: string
          overview: string
          website: string
          docs: string
          approved: boolean
        }
        Insert: {
          id?: number
          slug?: string
          type?: Database['public']['Enums']['partner_type']
          category?: string
          developer?: string
          title?: string
          description?: string
          logo?: string
          images?: string[]
          video?: string
          overview?: string
          website?: string
          docs?: string
          approved?: boolean
        }
        Update: {
          id?: number
          slug?: string
          type?: Database['public']['Enums']['partner_type']
          category?: string
          developer?: string
          title?: string
          description?: string
          logo?: string
          images?: string[]
          video?: string
          overview?: string
          website?: string
          docs?: string
          approved?: boolean
        }
      }
      partner_contacts: {
        Row: {
          id: number
          type: Database['public']['Enums']['partner_type']
          company: string
          country: string
          details?: string
          email: string
          first: string
          last: string
          phone?: string
          size?: number
          title?: string
          website: string
        }
        Insert: {
          id?: number
          type?: Database['public']['Enums']['partner_type']
          company?: string
          country?: string
          details?: string
          email?: string
          first?: string
          last?: string
          phone?: string
          size?: number
          title?: string
          website?: string
        }
        Update: {
          id?: number
          type?: Database['public']['Enums']['partner_type']
          company?: string
          country?: string
          details?: string
          email?: string
          first?: string
          last?: string
          phone?: string
          size?: number
          title?: string
          website?: string
        }
      }
    }
    Views: {}
    Functions: {
      derive_label_sort_from_label: {
        Args: { label: string }
        Returns: string
      }
    }
    Enums: {
      partner_type: 'technology' | 'expert'
    }
  }
}
