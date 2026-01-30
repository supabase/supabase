export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  content: {
    Tables: {
      error: {
        Row: {
          code: string
          created_at: string | null
          deleted_at: string | null
          http_status_code: number | null
          id: string
          message: string | null
          metadata: Json | null
          service: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          deleted_at?: string | null
          http_status_code?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          service: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          http_status_code?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          service?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_service_fkey"
            columns: ["service"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["id"]
          },
        ]
      }
      service: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_error_codes_except: { Args: { skip_codes: Json }; Returns: number }
      update_error_code: {
        Args: {
          code: string
          http_status_code?: number
          message?: string
          metadata?: Json
          service: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
          city: string | null
          country: string | null
          created_at: string
          display_info: string | null
          id: string
          is_live: boolean
          is_published: boolean
          launch_week: string
          link: string | null
          start_at: string | null
          timezone: string | null
          title: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          display_info?: string | null
          id?: string
          is_live?: boolean
          is_published?: boolean
          launch_week: string
          link?: string | null
          start_at?: string | null
          timezone?: string | null
          title?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          display_info?: string | null
          id?: string
          is_live?: boolean
          is_published?: boolean
          launch_week?: string
          link?: string | null
          start_at?: string | null
          timezone?: string | null
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
          fts_tokens: unknown
          id: number
          last_refresh: string | null
          meta: Json | null
          path: string
          source: string | null
          title_tokens: unknown
          type: string | null
          version: string | null
        }
        Insert: {
          checksum?: string | null
          content?: string | null
          fts_tokens?: unknown
          id?: number
          last_refresh?: string | null
          meta?: Json | null
          path: string
          source?: string | null
          title_tokens?: unknown
          type?: string | null
          version?: string | null
        }
        Update: {
          checksum?: string | null
          content?: string | null
          fts_tokens?: unknown
          id?: number
          last_refresh?: string | null
          meta?: Json | null
          path?: string
          source?: string | null
          title_tokens?: unknown
          type?: string | null
          version?: string | null
        }
        Relationships: []
      }
      page_nimbus: {
        Row: {
          checksum: string | null
          content: string | null
          fts_tokens: unknown
          id: number
          last_refresh: string | null
          meta: Json | null
          path: string
          source: string | null
          title_tokens: unknown
          type: string | null
          version: string | null
        }
        Insert: {
          checksum?: string | null
          content?: string | null
          fts_tokens?: unknown
          id?: never
          last_refresh?: string | null
          meta?: Json | null
          path: string
          source?: string | null
          title_tokens?: unknown
          type?: string | null
          version?: string | null
        }
        Update: {
          checksum?: string | null
          content?: string | null
          fts_tokens?: unknown
          id?: never
          last_refresh?: string | null
          meta?: Json | null
          path?: string
          source?: string | null
          title_tokens?: unknown
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
      page_section_nimbus: {
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
          id?: never
          page_id: number
          rag_ignore?: boolean | null
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: never
          page_id?: number
          rag_ignore?: boolean | null
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_section_nimbus_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_nimbus"
            referencedColumns: ["id"]
          },
        ]
      }
      pw_table_actions: {
        Row: {
          created_at: string | null
          id: number
          pw_column: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          pw_column?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          pw_column?: string | null
        }
        Relationships: []
      }
      pw_table_actions_duplicate: {
        Row: {
          created_at: string | null
          id: number
          pw_column: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          pw_column?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          pw_column?: string | null
        }
        Relationships: []
      }
      pw_table_rls_disabled: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      pw_table_rls_enabled: {
        Row: {
          created_at: string | null
          id: number
          pw_column: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          pw_column?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          pw_column?: string | null
        }
        Relationships: []
      }
      pw_table_updated: {
        Row: {
          created_at: string | null
          id: number
          pw_column_updated: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          pw_column_updated?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          pw_column_updated?: string | null
        }
        Relationships: []
      }
      pw_test_index_advisor: {
        Row: {
          id: number | null
          name: string | null
        }
        Insert: {
          id?: number | null
          name?: string | null
        }
        Update: {
          id?: number | null
          name?: string | null
        }
        Relationships: []
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
            foreignKeyName: "tickets_launch_week_fkey"
            columns: ["launch_week"]
            isOneToOne: false
            referencedRelation: "launch_weeks"
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
      cleanup_last_changed_pages: { Args: never; Returns: number }
      docs_search_embeddings: {
        Args: { embedding: string; match_threshold: number }
        Returns: {
          description: string
          headings: string[]
          id: number
          path: string
          slugs: string[]
          subtitle: string
          title: string
          type: string
        }[]
      }
      docs_search_embeddings_nimbus: {
        Args: { embedding: string; match_threshold: number }
        Returns: {
          description: string
          headings: string[]
          id: number
          path: string
          slugs: string[]
          subtitle: string
          title: string
          type: string
        }[]
      }
      docs_search_fts: {
        Args: { query: string }
        Returns: {
          description: string
          id: number
          path: string
          subtitle: string
          title: string
          type: string
        }[]
      }
      docs_search_fts_nimbus: {
        Args: { query: string }
        Returns: {
          description: string
          id: number
          path: string
          subtitle: string
          title: string
          type: string
        }[]
      }
      get_full_content_url: {
        Args: { path: string; slug: string; type: string }
        Returns: string
      }
      get_last_revalidation_for_tags: {
        Args: { tags: string[] }
        Returns: {
          created_at: string
          tag: string
        }[]
      }
      ipv6_active_status: {
        Args: { project_ref: string }
        Returns: {
          pgbouncer_active: boolean
          vercel_active: boolean
        }[]
      }
      json_matches_schema: {
        Args: { instance: Json; schema: Json }
        Returns: boolean
      }
      jsonb_matches_schema: {
        Args: { instance: Json; schema: Json }
        Returns: boolean
      }
      jsonschema_is_valid: { Args: { schema: Json }; Returns: boolean }
      jsonschema_validation_errors: {
        Args: { instance: Json; schema: Json }
        Returns: string[]
      }
      match_embedding: {
        Args: {
          embedding: string
          match_threshold?: number
          max_results?: number
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
        SetofOptions: {
          from: "*"
          to: "page_section"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_embedding_nimbus: {
        Args: {
          embedding: string
          match_threshold?: number
          max_results?: number
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
        SetofOptions: {
          from: "*"
          to: "page_section_nimbus"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "page_section"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_page_sections_v2_nimbus: {
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
        SetofOptions: {
          from: "*"
          to: "page_section_nimbus"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_content: {
        Args: {
          embedding: string
          include_full_content?: boolean
          match_threshold?: number
          max_result?: number
        }
        Returns: {
          content: string
          href: string
          id: number
          metadata: Json
          page_title: string
          subsections: Json[]
          type: string
        }[]
      }
      search_content_hybrid: {
        Args: {
          full_text_weight?: number
          include_full_content?: boolean
          match_threshold?: number
          max_result?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string
          href: string
          id: number
          metadata: Json
          page_title: string
          subsections: Json[]
          type: string
        }[]
      }
      search_content_hybrid_nimbus: {
        Args: {
          full_text_weight?: number
          include_full_content?: boolean
          match_threshold?: number
          max_result?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string
          href: string
          id: number
          metadata: Json
          page_title: string
          subsections: Json[]
          type: string
        }[]
      }
      search_content_nimbus: {
        Args: {
          embedding: string
          include_full_content?: boolean
          match_threshold?: number
          max_result?: number
        }
        Returns: {
          content: string
          href: string
          id: number
          metadata: Json
          page_title: string
          subsections: Json[]
          type: string
        }[]
      }
      update_last_changed_checksum: {
        Args: {
          check_time: string
          git_update_time: string
          new_checksum: string
          new_heading: string
          new_parent_page: string
        }
        Returns: string
      }
      validate_troubleshooting_errors: {
        Args: { errors: Json[] }
        Returns: boolean
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
          type: Database["storage"]["Enums"]["buckettype"]
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
          type?: Database["storage"]["Enums"]["buckettype"]
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
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
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
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
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
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  content: {
    Enums: {},
  },
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      feedback_vote: ["yes", "no"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

