export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: number
          user_id: number
          phone_number_id: number
          caller_number: string
          status: string
          duration: number
          created_at: string
          routed_to_location: number | null
          call_type: string
        }
        Insert: {
          user_id: number
          phone_number_id: number
          caller_number: string
          status: string
          duration?: number
          created_at?: string
          routed_to_location?: number | null
          call_type?: string
        }
        Update: {
          status?: string
          duration?: number
        }
      }
      messages: {
        Row: {
          id: number
          user_id: number
          phone_number_id: number
          type: string
          content: string
          recipient: string
          status: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          user_id: number
          phone_number_id: number
          type: string
          content: string
          recipient: string
          status: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          status?: string
          metadata?: Json | null
        }
      }
      templates: {
        Row: {
          id: number
          user_id: number
          location_id: number | null
          group_id: number | null
          name: string
          content: string
          type: string
          variables: Json | null
          created_at: string
        }
        Insert: {
          user_id: number
          location_id?: number | null
          group_id?: number | null
          name: string
          content: string
          type: string
          variables?: Json | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: number
          user_id: number
          group_id: number | null
          name: string
          address: string
          is_first_location: boolean
          trial_start_date: string | null
          created_at: string
        }
        Insert: {
          user_id: number
          group_id?: number | null
          name: string
          address: string
          is_first_location?: boolean
          trial_start_date?: string | null
          created_at?: string
        }
      }
      phone_numbers: {
        Row: {
          id: number
          user_id: number
          location_id: number
          number: string
          type: string
          active: boolean
          linked_number: string | null
          created_at: string
        }
        Insert: {
          user_id: number
          location_id: number
          number: string
          type: string
          active?: boolean
          linked_number?: string | null
          created_at?: string
        }
      }
    }
    Enums: {
      call_status: 'answered' | 'missed' | 'busy' | 'failed'
      message_type: 'SMS' | 'WhatsApp'
      message_status: 'pending' | 'sent' | 'delivered' | 'failed'
      template_type: 'missed_call' | 'welcome' | 'reminder' | 'custom'
    }
  }
}
