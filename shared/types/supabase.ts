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
      calls: {
        Row: {
          call_type: string | null
          caller_number: string | null
          created_at: string | null
          duration: number | null
          id: number
          phone_number_id: number | null
          routed_to_location: number | null
          status: string | null
          user_id: number | null
        }
        Insert: {
          call_type?: string | null
          caller_number?: string | null
          created_at?: string | null
          duration?: number | null
          id?: number
          phone_number_id?: number | null
          routed_to_location?: number | null
          status?: string | null
          user_id?: number | null
        }
        Update: {
          call_type?: string | null
          caller_number?: string | null
          created_at?: string | null
          duration?: number | null
          id?: number
          phone_number_id?: number | null
          routed_to_location?: number | null
          status?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          description: string | null
          id: number
          metadata: Json | null
          title: string
          type: string
          url: string
          user_id: number
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          description?: string | null
          id?: number
          metadata?: Json | null
          title: string
          type: string
          url: string
          user_id: number
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          description?: string | null
          id?: number
          metadata?: Json | null
          title?: string
          type?: string
          url?: string
          user_id?: number
        }
        Relationships: []
      }
      groups: {
        Row: {
          active: boolean | null
          id: number
          name: string
          shared_number: string | null
          user_id: number
        }
        Insert: {
          active?: boolean | null
          id?: number
          name: string
          shared_number?: string | null
          user_id: number
        }
        Update: {
          active?: boolean | null
          id?: number
          name?: string
          shared_number?: string | null
          user_id?: number
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          business_hours: Json | null
          group_id: number | null
          id: number
          is_first_location: boolean | null
          name: string
          timezone: string | null
          trial_start_date: string | null
          user_id: number
        }
        Insert: {
          address: string
          business_hours?: Json | null
          group_id?: number | null
          id?: number
          is_first_location?: boolean | null
          name: string
          timezone?: string | null
          trial_start_date?: string | null
          user_id: number
        }
        Update: {
          address?: string
          business_hours?: Json | null
          group_id?: number | null
          id?: number
          is_first_location?: boolean | null
          name?: string
          timezone?: string | null
          trial_start_date?: string | null
          user_id?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: number
          phone_number_id: number
          recipient: string
          status: string
          type: string
          user_id: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          phone_number_id: number
          recipient: string
          status: string
          type: string
          user_id: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          phone_number_id?: number
          recipient?: string
          status?: string
          type?: string
          user_id?: number
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          active: boolean | null
          channel: string
          forwarding_enabled: boolean | null
          id: number
          linked_number: string | null
          location_id: number
          phone_number: string
          type: string
          user_id: number
        }
        Insert: {
          active?: boolean | null
          channel: string
          forwarding_enabled?: boolean | null
          id?: number
          linked_number?: string | null
          location_id: number
          phone_number: string
          type: string
          user_id: number
        }
        Update: {
          active?: boolean | null
          channel?: string
          forwarding_enabled?: boolean | null
          id?: number
          linked_number?: string | null
          location_id?: number
          phone_number?: string
          type?: string
          user_id?: number
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          conditions: Json
          forwarding_number: string | null
          id: number
          ivr_options: Json | null
          location_id: number
          priority: number
          user_id: number
        }
        Insert: {
          conditions: Json
          forwarding_number?: string | null
          id?: number
          ivr_options?: Json | null
          location_id: number
          priority: number
          user_id: number
        }
        Update: {
          conditions?: Json
          forwarding_number?: string | null
          id?: number
          ivr_options?: Json | null
          location_id?: number
          priority?: number
          user_id?: number
        }
        Relationships: []
      }
      templates: {
        Row: {
          channel: string
          content: string
          group_id: number | null
          id: number
          location_id: number | null
          name: string
          type: string
          user_id: number
          variables: Json | null
        }
        Insert: {
          channel: string
          content: string
          group_id?: number | null
          id?: number
          location_id?: number | null
          name: string
          type: string
          user_id: number
          variables?: Json | null
        }
        Update: {
          channel?: string
          content?: string
          group_id?: number | null
          id?: number
          location_id?: number | null
          name?: string
          type?: string
          user_id?: number
          variables?: Json | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          password_hash?: string
          username?: string
        }
        Relationships: []
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
