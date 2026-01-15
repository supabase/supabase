export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      contribute_posts: {
        Row: {
          activity_type: string | null
          author: string | null
          common_room_activity_url: string | null
          content: string | null
          external_activity_url: string | null
          id: string
          kind: string | null
          raw: Json | null
          service_name: string | null
          source_id: string | null
          tags: Json | null
          thread_key: string | null
          title: string | null
          topics: Json | null
          ts: string | null
        }
        Insert: {
          activity_type?: string | null
          author?: string | null
          common_room_activity_url?: string | null
          content?: string | null
          external_activity_url?: string | null
          id: string
          kind?: string | null
          raw?: Json | null
          service_name?: string | null
          source_id?: string | null
          tags?: Json | null
          thread_key?: string | null
          title?: string | null
          topics?: Json | null
          ts?: string | null
        }
        Update: {
          activity_type?: string | null
          author?: string | null
          common_room_activity_url?: string | null
          content?: string | null
          external_activity_url?: string | null
          id?: string
          kind?: string | null
          raw?: Json | null
          service_name?: string | null
          source_id?: string | null
          tags?: Json | null
          thread_key?: string | null
          title?: string | null
          topics?: Json | null
          ts?: string | null
        }
        Relationships: []
      }
      contribute_threads: {
        Row: {
          author: string
          category: string | null
          conversation: string
          created_at: string | null
          entities: string[] | null
          external_activity_url: string | null
          first_msg_time: string | null
          id: string
          labels: string[] | null
          last_msg_time: string | null
          message_count: number | null
          metadata: Json | null
          processed_at: string | null
          product_areas: string[] | null
          resolved_by: string | null
          sentiment: string | null
          source: string | null
          stack: string[] | null
          status: string | null
          sub_category: string | null
          subject: string | null
          subject_embedding: string | null
          summary: string | null
          thread_id: string
          thread_key: string | null
          title: string
          topic: string | null
          topic_embedding: string | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          author: string
          category?: string | null
          conversation: string
          created_at?: string | null
          entities?: string[] | null
          external_activity_url?: string | null
          first_msg_time?: string | null
          id?: string
          labels?: string[] | null
          last_msg_time?: string | null
          message_count?: number | null
          metadata?: Json | null
          processed_at?: string | null
          product_areas?: string[] | null
          resolved_by?: string | null
          sentiment?: string | null
          source?: string | null
          stack?: string[] | null
          status?: string | null
          sub_category?: string | null
          subject?: string | null
          subject_embedding?: string | null
          summary?: string | null
          thread_id: string
          thread_key?: string | null
          title: string
          topic?: string | null
          topic_embedding?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: string | null
          conversation?: string
          created_at?: string | null
          entities?: string[] | null
          external_activity_url?: string | null
          first_msg_time?: string | null
          id?: string
          labels?: string[] | null
          last_msg_time?: string | null
          message_count?: number | null
          metadata?: Json | null
          processed_at?: string | null
          product_areas?: string[] | null
          resolved_by?: string | null
          sentiment?: string | null
          source?: string | null
          stack?: string[] | null
          status?: string | null
          sub_category?: string | null
          subject?: string | null
          subject_embedding?: string | null
          summary?: string | null
          thread_id?: string
          thread_key?: string | null
          title?: string
          topic?: string | null
          topic_embedding?: string | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_contribute_pending_posts_to_threads: {
        Row: {
          activity_type: string | null
          author: string | null
          common_room_activity_url: string | null
          content: string | null
          external_activity_url: string | null
          id: string | null
          kind: string | null
          raw: Json | null
          service_name: string | null
          source_id: string | null
          tags: Json | null
          thread_key: string | null
          title: string | null
          topics: Json | null
          ts: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      reprocess_stale_threads: { Args: never; Returns: undefined }
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
