export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string // uuid
          auth_id: string
          username: string
          email: string
          company_name: string
        }
        Insert: {
          id?: string
          auth_id: string
          username: string
          email: string
          company_name: string
        }
        Update: {
          id?: string
          auth_id?: string
          username?: string
          email?: string
          company_name?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: number
          user_id: string
          name: string
          shared_number: string | null
          active: boolean | null
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          shared_number?: string | null
          active?: boolean | null
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          shared_number?: string | null
          active?: boolean | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: number
          user_id: string
          group_id: number | null
          name: string
          address: string
          timezone: string | null
          business_hours: Json | null
          trial_start_date: string | null
          is_first_location: boolean | null
        }
        Insert: {
          id?: number
          user_id: string
          group_id?: number | null
          name: string
          address: string
          timezone?: string | null
          business_hours?: Json | null
          trial_start_date?: string | null
          is_first_location?: boolean | null
        }
        Update: {
          id?: number
          user_id?: string
          group_id?: number | null
          name?: string
          address?: string
          timezone?: string | null
          business_hours?: Json | null
          trial_start_date?: string | null
          is_first_location?: boolean | null
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          id: number
          user_id: string
          location_id: number
          phone_number: string
          type: string
          linked_number: string | null
          channel: string
          active: boolean | null
          forwarding_enabled: boolean | null
        }
        Insert: {
          id?: number
          user_id: string
          location_id: number
          phone_number: string
          type: string
          linked_number?: string | null
          channel: string
          active?: boolean | null
          forwarding_enabled?: boolean | null
        }
        Update: {
          id?: number
          user_id?: string
          location_id?: number
          phone_number?: string
          type?: string
          linked_number?: string | null
          channel?: string
          active?: boolean | null
          forwarding_enabled?: boolean | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: number
          user_id: string
          location_id: number | null
          group_id: number | null
          name: string
          content: string
          type: string
          channel: string
          variables: Json | null
        }
        Insert: {
          id?: number
          user_id: string
          location_id?: number | null
          group_id?: number | null
          name: string
          content: string
          type: string
          channel: string
          variables?: Json | null
        }
        Update: {
          id?: number
          user_id?: string
          location_id?: number | null
          group_id?: number | null
          name?: string
          content?: string
          type?: string
          channel?: string
          variables?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: number
          user_id: string
          phone_number_id: number
          type: string
          content: string
          recipient: string
          status: string
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          phone_number_id: number
          type: string
          content: string
          recipient: string
          status: string
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          phone_number_id?: number
          type?: string
          content?: string
          recipient?: string
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          id: number
          user_id: string | null
          phone_number_id: number | null
          caller_number: string | null
          status: string | null
          duration: number | null
          created_at: string | null
          routed_to_location: number | null
          call_type: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          phone_number_id?: number | null
          caller_number?: string | null
          status?: string | null
          duration?: number | null
          created_at?: string | null
          routed_to_location?: number | null
          call_type?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          phone_number_id?: number | null
          caller_number?: string | null
          status?: string | null
          duration?: number | null
          created_at?: string | null
          routed_to_location?: number | null
          call_type?: string | null
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          id: number
          user_id: string
          location_id: number
          priority: number
          conditions: Json
          forwarding_number: string | null
          ivr_options: Json | null
        }
        Insert: {
          id?: number
          user_id: string
          location_id: number
          priority: number
          conditions: Json
          forwarding_number?: string | null
          ivr_options?: Json | null
        }
        Update: {
          id?: number
          user_id?: string
          location_id?: number
          priority?: number
          conditions?: Json
          forwarding_number?: string | null
          ivr_options?: Json | null
        }
        Relationships: []
      }
      contents: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          type: string
          url: string
          category: string
          metadata: Json | null
          created_at: string | null
          active: boolean | null
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          type: string
          url: string
          category: string
          metadata?: Json | null
          created_at?: string | null
          active?: boolean | null
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          type?: string
          url?: string
          category?: string
          metadata?: Json | null
          created_at?: string | null
          active?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

