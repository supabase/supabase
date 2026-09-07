export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          active_request_id: string | null
          active_since: string | null
          branched_from: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          model: string | null
          name: string
          org_slug: string
          project_ref: string
          revision: number
          support_metadata: Json | null
          surface: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_request_id?: string | null
          active_since?: string | null
          branched_from?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          model?: string | null
          name?: string
          org_slug: string
          project_ref: string
          revision?: number
          support_metadata?: Json | null
          surface?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_request_id?: string | null
          active_since?: string | null
          branched_from?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          model?: string | null
          name?: string
          org_slug?: string
          project_ref?: string
          revision?: number
          support_metadata?: Json | null
          surface?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_installations: {
        Row: {
          account_login: string
          created_at: string
          id: string
          installation_id: number
          user_id: string
        }
        Insert: {
          account_login: string
          created_at?: string
          id?: string
          installation_id: number
          user_id: string
        }
        Update: {
          account_login?: string
          created_at?: string
          id?: string
          installation_id?: number
          user_id?: string
        }
        Relationships: []
      }
      message_feedback: {
        Row: {
          braintrust_span_id: string | null
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          rating: string
          reason: string | null
          user_id: string
        }
        Insert: {
          braintrust_span_id?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          rating: string
          reason?: string | null
          user_id: string
        }
        Update: {
          braintrust_span_id?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          rating?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_feedback_conversation_id_message_id_fkey'
            columns: ['conversation_id', 'message_id']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['conversation_id', 'id']
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          parts: Json
          role: string
          seq: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id: string
          metadata?: Json | null
          parts: Json
          role: string
          seq?: never
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          parts?: Json
          role?: string
          seq?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
        ]
      }
      oauth_connections: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          org_slug: string
          scopes: string[]
          updated_at: string
          user_id: string
          vault_secret_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          org_slug: string
          scopes?: string[]
          updated_at?: string
          user_id: string
          vault_secret_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          org_slug?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
          vault_secret_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          code_challenge: string | null
          expires_at: string
          org_slug: string
          return_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          code_challenge?: string | null
          expires_at: string
          org_slug: string
          return_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          code_challenge?: string | null
          expires_at?: string
          org_slug?: string
          return_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_identities: {
        Row: {
          created_at: string
          email: string | null
          platform_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          platform_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          platform_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_permissions: {
        Row: {
          consent_version: number
          level: string
          org_slug: string
          project_ref: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_version: number
          level: string
          org_slug: string
          project_ref: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_version?: number
          level?: string
          org_slug?: string
          project_ref?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_repos: {
        Row: {
          created_at: string
          default_branch: string
          id: string
          installation_id: number
          project_ref: string
          repo_full_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          id?: string
          installation_id: number
          project_ref: string
          repo_full_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          id?: string
          installation_id?: number
          project_ref?: string
          repo_full_name?: string
          user_id?: string
        }
        Relationships: []
      }
      sandboxes: {
        Row: {
          agent_session_id: string | null
          branch: string
          conversation_id: string
          created_at: string
          endpoint_url: string | null
          id: string
          last_activity_at: string
          project_repo_id: string
          provider: string
          provider_ref: string | null
          status: string
          terminated_at: string | null
          user_id: string
        }
        Insert: {
          agent_session_id?: string | null
          branch: string
          conversation_id: string
          created_at?: string
          endpoint_url?: string | null
          id?: string
          last_activity_at?: string
          project_repo_id: string
          provider: string
          provider_ref?: string | null
          status: string
          terminated_at?: string | null
          user_id: string
        }
        Update: {
          agent_session_id?: string | null
          branch?: string
          conversation_id?: string
          created_at?: string
          endpoint_url?: string | null
          id?: string
          last_activity_at?: string
          project_repo_id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          terminated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sandboxes_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sandboxes_project_repo_id_fkey'
            columns: ['project_repo_id']
            isOneToOne: false
            referencedRelation: 'project_repos'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
