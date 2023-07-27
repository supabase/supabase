export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      partner_contacts: {
        Row: {
          company: string
          contacted: boolean
          country: string
          created_at: string
          details: string | null
          email: string
          first: string
          id: number
          last: string
          phone: string | null
          size: number | null
          title: string | null
          type: Database['public']['Enums']['partner_type']
          website: string
        }
        Insert: {
          company: string
          contacted?: boolean
          country: string
          created_at?: string
          details?: string | null
          email: string
          first: string
          id?: number
          last: string
          phone?: string | null
          size?: number | null
          title?: string | null
          type: Database['public']['Enums']['partner_type']
          website: string
        }
        Update: {
          company?: string
          contacted?: boolean
          country?: string
          created_at?: string
          details?: string | null
          email?: string
          first?: string
          id?: number
          last?: string
          phone?: string | null
          size?: number | null
          title?: string | null
          type?: Database['public']['Enums']['partner_type']
          website?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          approved: boolean | null
          call_to_action_link: string | null
          category: string
          contact: number
          created_at: string
          description: string
          developer: string
          docs: string | null
          featured: boolean
          id: number
          images: string[] | null
          logo: string
          overview: string
          slug: string
          title: string
          tsv: unknown | null
          type: Database['public']['Enums']['partner_type']
          video: string | null
          website: string
        }
        Insert: {
          approved?: boolean | null
          call_to_action_link?: string | null
          category: string
          contact: number
          created_at?: string
          description: string
          developer: string
          docs?: string | null
          featured?: boolean
          id?: number
          images?: string[] | null
          logo: string
          overview: string
          slug: string
          title: string
          tsv?: unknown | null
          type: Database['public']['Enums']['partner_type']
          video?: string | null
          website: string
        }
        Update: {
          approved?: boolean | null
          call_to_action_link?: string | null
          category?: string
          contact?: number
          created_at?: string
          description?: string
          developer?: string
          docs?: string | null
          featured?: boolean
          id?: number
          images?: string[] | null
          logo?: string
          overview?: string
          slug?: string
          title?: string
          tsv?: unknown | null
          type?: Database['public']['Enums']['partner_type']
          video?: string | null
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: 'partners_contact_fkey'
            columns: ['contact']
            referencedRelation: 'partner_contacts'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      partner_type: 'technology' | 'expert'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
