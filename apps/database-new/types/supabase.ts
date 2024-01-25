export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      messages_user: {
        Row: {
          created_at: string
          id: number
          message_id: string | null
          modified_at: string | null
          run_id: string
          text: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message_id?: string | null
          modified_at?: string | null
          run_id: string
          text?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message_id?: string | null
          modified_at?: string | null
          run_id?: string
          text?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_user_thread_id_fkey'
            columns: ['thread_id']
            referencedRelation: 'threads'
            referencedColumns: ['thread_id']
          },
          {
            foreignKeyName: 'messages_user_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      responses_ai: {
        Row: {
          created_at: string
          id: number
          message_id: string
          modified_at: string | null
          run_id: string | null
          text: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message_id: string
          modified_at?: string | null
          run_id?: string | null
          text?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message_id?: string
          modified_at?: string | null
          run_id?: string | null
          text?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'responses_ai_thread_id_fkey'
            columns: ['thread_id']
            referencedRelation: 'threads'
            referencedColumns: ['thread_id']
          },
          {
            foreignKeyName: 'responses_ai_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: number
          latest_message_id: string | null
          modified_at: string
          run_id: string
          thread_id: string
          thread_title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          latest_message_id?: string | null
          modified_at?: string
          run_id: string
          thread_id: string
          thread_title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          latest_message_id?: string | null
          modified_at?: string
          run_id?: string
          thread_id?: string
          thread_title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'threads_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
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
