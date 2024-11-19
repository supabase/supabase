export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          date_created: string
          id: number
          metadata: Json | null
          page: string
          vote: Database["public"]["Enums"]["feedback_vote"]
        }
        Insert: {
          date_created?: string
          id?: never
          metadata?: Json | null
          page: string
          vote: Database["public"]["Enums"]["feedback_vote"]
        }
        Update: {
          date_created?: string
          id?: never
          metadata?: Json | null
          page?: string
          vote?: Database["public"]["Enums"]["feedback_vote"]
        }
        Relationships: []
      }
      last_changed: {
        Row: {
          checksum: string
          heading: string
          id: number
          last_checked: string
          last_updated: string
          parent_page: string
        }
        Insert: {
          checksum: string
          heading: string
          id?: never
          last_checked?: string
          last_updated?: string
          parent_page: string
        }
        Update: {
          checksum?: string
          heading?: string
          id?: never
          last_checked?: string
          last_updated?: string
          parent_page?: string
        }
        Relationships: []
      }
      launch_weeks: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
        }
        Relationships: []
      }
      meetups: {
        Row: {
          country: string | null
          created_at: string
          display_info: string | null
          id: string
          is_live: boolean
          is_published: boolean
          launch_week: string
          link: string | null
          start_at: string | null
          title: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_info?: string | null
          id?: string
          is_live?: boolean
          is_published?: boolean
          launch_week: string
          link?: string | null
          start_at?: string | null
          title?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          display_info?: string | null
          id?: string
          is_live?: boolean
          is_published?: boolean
          launch_week?: string
          link?: string | null
          start_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetups_launch_week_fkey"
            columns: ["launch_week"]
            isOneToOne: false
            referencedRelation: "launch_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      page: {
        Row: {
          checksum: string | null
          content: string | null
          fts_tokens: unknown | null
          id: number
          last_refresh: string | null
          meta: Json | null
          path: string
          source: string | null
          title_tokens: unknown | null
          type: string | null
          version: string | null
        }
        Insert: {
          checksum?: string | null
          content?: string | null
          fts_tokens?: unknown | null
          id?: number
          last_refresh?: string | null
          meta?: Json | null
          path: string
          source?: string | null
          title_tokens?: unknown | null
          type?: string | null
          version?: string | null
        }
        Update: {
          checksum?: string | null
          content?: string | null
          fts_tokens?: unknown | null
          id?: number
          last_refresh?: string | null
          meta?: Json | null
          path?: string
          source?: string | null
          title_tokens?: unknown | null
          type?: string | null
          version?: string | null
        }
        Relationships: []
      }
      page_section: {
        Row: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          rag_ignore: boolean | null
          slug: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id: number
          rag_ignore?: boolean | null
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id?: number
          rag_ignore?: boolean | null
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_section_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          game_won_at: string | null
          id: string
          launch_week: string
          location: string | null
          metadata: Json | null
          name: string | null
          referred_by: string | null
          role: string | null
          shared_on_linkedin: string | null
          shared_on_twitter: string | null
          ticket_number: number
          user_id: string
          username: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          game_won_at?: string | null
          id?: string
          launch_week: string
          location?: string | null
          metadata?: Json | null
          name?: string | null
          referred_by?: string | null
          role?: string | null
          shared_on_linkedin?: string | null
          shared_on_twitter?: string | null
          ticket_number?: number
          user_id: string
          username?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          game_won_at?: string | null
          id?: string
          launch_week?: string
          location?: string | null
          metadata?: Json | null
          name?: string | null
          referred_by?: string | null
          role?: string | null
          shared_on_linkedin?: string | null
          shared_on_twitter?: string | null
          ticket_number?: number
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_tickets_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_launch_week_fkey"
            columns: ["launch_week"]
            isOneToOne: false
            referencedRelation: "launch_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      troubleshooting_entries: {
        Row: {
          api: Json | null
          checksum: string
          date_created: string
          date_updated: string
          errors: Json[] | null
          github_id: string
          github_url: string
          id: string
          keywords: string[] | null
          title: string
          topics: string[]
        }
        Insert: {
          api?: Json | null
          checksum: string
          date_created?: string
          date_updated?: string
          errors?: Json[] | null
          github_id: string
          github_url: string
          id?: string
          keywords?: string[] | null
          title: string
          topics: string[]
        }
        Update: {
          api?: Json | null
          checksum?: string
          date_created?: string
          date_updated?: string
          errors?: Json[] | null
          github_id?: string
          github_url?: string
          id?: string
          keywords?: string[] | null
          title?: string
          topics?: string[]
        }
        Relationships: []
      }
      validation_history: {
        Row: {
          created_at: string
          id: number
          tag: string
        }
        Insert: {
          created_at?: string
          id?: never
          tag: string
        }
        Update: {
          created_at?: string
          id?: never
          tag?: string
        }
        Relationships: []
      }
    }
    Views: {
      tickets_view: {
        Row: {
          company: string | null
          created_at: string | null
          id: string | null
          launch_week: string | null
          location: string | null
          metadata: Json | null
          name: string | null
          platinum: boolean | null
          referrals: number | null
          role: string | null
          secret: boolean | null
          shared_on_linkedin: string | null
          shared_on_twitter: string | null
          ticket_number: number | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_launch_week_fkey"
            columns: ["launch_week"]
            isOneToOne: false
            referencedRelation: "launch_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_last_changed_pages: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      docs_search_embeddings: {
        Args: {
          embedding: string
          match_threshold: number
        }
        Returns: {
          id: number
          path: string
          type: string
          title: string
          subtitle: string
          description: string
          headings: string[]
          slugs: string[]
        }[]
      }
      docs_search_fts: {
        Args: {
          query: string
        }
        Returns: {
          id: number
          path: string
          type: string
          title: string
          subtitle: string
          description: string
        }[]
      }
      get_last_revalidation_for_tags: {
        Args: {
          tags: string[]
        }
        Returns: {
          tag: string
          created_at: string
        }[]
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ipv6_active_status: {
        Args: {
          project_ref: string
        }
        Returns: {
          pgbouncer_active: boolean
          vercel_active: boolean
        }[]
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      json_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: boolean
      }
      jsonschema_is_valid: {
        Args: {
          schema: Json
        }
        Returns: boolean
      }
      jsonschema_validation_errors: {
        Args: {
          schema: Json
          instance: Json
        }
        Returns: string[]
      }
      match_page_sections_v2: {
        Args: {
          embedding: string
          match_threshold: number
          min_content_length: number
        }
        Returns: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          rag_ignore: boolean | null
          slug: string | null
          token_count: number | null
        }[]
      }
      update_last_changed_checksum: {
        Args: {
          new_parent_page: string
          new_heading: string
          new_checksum: string
          git_update_time: string
          check_time: string
        }
        Returns: string
      }
      validate_troubleshooting_errors: {
        Args: {
          errors: Json[]
        }
        Returns: boolean
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      feedback_vote: "yes" | "no"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

