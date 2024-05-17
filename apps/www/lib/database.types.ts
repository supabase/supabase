export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      dpa_downloads: {
        Row: {
          contact_email: string
          created_at: string | null
          document: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string | null
          document?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string | null
          document?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      lwx_meetups: {
        Row: {
          created_at: string | null
          display_info: string | null
          id: number
          isLive: boolean
          link: string | null
          start_at: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          display_info?: string | null
          id?: number
          isLive?: boolean
          link?: string | null
          start_at?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          display_info?: string | null
          id?: number
          isLive?: boolean
          link?: string | null
          start_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      lw11_meetups: {
        Row: {
          created_at: string | null
          display_info: string | null
          id: number
          isLive: boolean
          link: string | null
          start_at: string | number
          title: string | null
        }
        Insert: {
          created_at?: string | null
          display_info?: string | null
          id?: number
          isLive?: boolean
          link?: string | null
          start_at?: string | number
          title?: string | null
        }
        Update: {
          created_at?: string | null
          display_info?: string | null
          id?: number
          isLive?: boolean
          link?: string | null
          start_at?: string | number
          title?: string | null
        }
        Relationships: []
      }
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
          featured: boolean | null
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
          featured?: boolean | null
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
          featured?: boolean | null
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
            isOneToOne: false
            referencedRelation: 'partner_contacts'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      lwx_tickets_golden: {
        Row: {
          createdAt: string | null
          golden: boolean | null
          id: string | null
          metadata: Json | null
          name: string | null
          referrals: number | null
          sharedOnLinkedIn: string | null
          sharedOnTwitter: string | null
          ticketNumber: number | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lwx_tickets_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      lw11_tickets_platinum: {
        Row: {
          createdAt: string | null
          platinum: boolean | null
          id: string | null
          metadata: Json | null
          name: string | null
          referrals: number | null
          sharedOnLinkedIn: string | null
          sharedOnTwitter: string | null
          ticketNumber: number | null
          username: string | null
          secret: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'lw11_tickets_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {}
    Enums: {
      partner_type: 'technology' | 'expert'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
