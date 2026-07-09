export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'

export type QuoteStage = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'follow_up'

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          owner_id: string
          name: string
          company: string | null
          email: string | null
          phone: string | null
          source: string | null
          status: LeadStatus
          estimated_value: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          name: string
          company?: string | null
          email?: string | null
          phone?: string | null
          source?: string | null
          status?: LeadStatus
          estimated_value?: number | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
        Relationships: []
      }
      quotes: {
        Row: {
          id: string
          owner_id: string
          lead_id: string | null
          title: string
          amount: number
          stage: QuoteStage
          sent_at: string | null
          decided_at: string | null
          valid_until: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          lead_id?: string | null
          title: string
          amount?: number
          stage?: QuoteStage
          sent_at?: string | null
          decided_at?: string | null
          valid_until?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'quotes_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      activities: {
        Row: {
          id: string
          owner_id: string
          lead_id: string | null
          quote_id: string | null
          type: ActivityType
          subject: string
          notes: string | null
          due_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          lead_id?: string | null
          quote_id?: string | null
          type?: ActivityType
          subject: string
          notes?: string | null
          due_at?: string | null
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'activities_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activities_quote_id_fkey'
            columns: ['quote_id']
            isOneToOne: false
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

export type Lead = Database['public']['Tables']['leads']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
