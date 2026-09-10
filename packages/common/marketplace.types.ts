export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      catalog_listings: {
        Row: {
          built_by: string | null
          categories: Json | null
          content: string | null
          description: string | null
          documentation_url: string | null
          featured: boolean | null
          id: string | null
          images: string[] | null
          listing_logo: string | null
          listing_tsv: unknown
          marketplace_url: string | null
          partner_id: string | null
          partner_logo: string | null
          partner_name: string | null
          partner_slug: string | null
          published_in_marketplace: boolean | null
          slug: string | null
          title: string | null
          website_url: string | null
          youtube_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'listings_partner_id_fkey'
            columns: ['partner_id']
            isOneToOne: false
            referencedRelation: 'partners'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          aud: string | null
          built_by: string | null
          categories: Json | null
          content: string | null
          description: string | null
          documentation_url: string | null
          edge_function_secret_name: string | null
          featured: boolean | null
          id: string | null
          images: string[] | null
          installation_identification_method:
            | 'secret_key_prefix'
            | 'edge_function_secret_name'
            | 'integration_status'
            | 'oauth_authorization'
            | null
          installation_url: string | null
          installation_url_type: 'get' | 'post' | null
          listing_logo: string | null
          listing_tsv: unknown
          marketplace_url: string | null
          oauth_app_id: string | null
          partner_id: string | null
          partner_logo: string | null
          partner_name: string | null
          partner_slug: string | null
          published_in_catalog_at: string | null
          published_in_marketplace_at: string | null
          secret_key_prefix: string | null
          slug: string | null
          title: string | null
          website_url: string | null
          youtube_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'listings_partner_id_fkey'
            columns: ['partner_id']
            isOneToOne: false
            referencedRelation: 'partners'
            referencedColumns: ['id']
          },
        ]
      }
      marketplace_listings: {
        Row: {
          built_by: string | null
          categories: Json | null
          content: string | null
          description: string | null
          documentation_url: string | null
          edge_function_secret_name: string | null
          featured: boolean | null
          id: string | null
          images: string[] | null
          installation_identification_method:
            | 'secret_key_prefix'
            | 'edge_function_secret_name'
            | 'integration_status'
            | 'oauth_authorization'
            | null
          installation_url: string | null
          installation_url_type: 'get' | 'post' | null
          listing_logo: string | null
          oauth_app_id: string | null
          partner_id: string | null
          partner_logo: string | null
          partner_name: string | null
          partner_slug: string | null
          published_in_marketplace_at: string | null
          review_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'preview' | null
          secret_key_prefix: string | null
          slug: string | null
          title: string | null
          website_url: string | null
          youtube_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'listings_partner_id_fkey'
            columns: ['partner_id']
            isOneToOne: false
            referencedRelation: 'partners'
            referencedColumns: ['id']
          },
        ]
      }
      partners: {
        Row: {
          country: string | null
          description: string | null
          id: string | null
          logo: string | null
          name: string | null
          num_of_employees: number | null
          slug: string | null
          type: 'technology' | 'expert' | null
          website: string | null
        }
        Insert: {
          country?: string | null
          description?: string | null
          id?: string | null
          logo?: never
          name?: string | null
          num_of_employees?: number | null
          slug?: string | null
          type?: 'technology' | 'expert' | null
          website?: string | null
        }
        Update: {
          country?: string | null
          description?: string | null
          id?: string | null
          logo?: never
          name?: string | null
          num_of_employees?: number | null
          slug?: string | null
          type?: 'technology' | 'expert' | null
          website?: string | null
        }
        Relationships: []
      }
      project_integration_status: {
        Row: {
          created_at: string | null
          integration_id: string | null
          listing_slug: string | null
          partner_links: Json | null
          project_ref: string | null
          status: 'installing' | 'ready' | 'error' | null
          updated_at: string | null
          user_alert: Json | null
          version: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
