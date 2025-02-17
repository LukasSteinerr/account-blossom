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
      game_codes: {
        Row: {
          additional_info: string | null
          code_image_url: string | null
          code_text: string | null
          code_value: number | null
          created_at: string
          expiration_date: string | null
          game_id: string
          id: string
          payment_status: string | null
          price: number
          region: string | null
          seller_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          verification_deadline: string | null
          verification_status: string | null
        }
        Insert: {
          additional_info?: string | null
          code_image_url?: string | null
          code_text?: string | null
          code_value?: number | null
          created_at?: string
          expiration_date?: string | null
          game_id: string
          id?: string
          payment_status?: string | null
          price: number
          region?: string | null
          seller_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          verification_deadline?: string | null
          verification_status?: string | null
        }
        Update: {
          additional_info?: string | null
          code_image_url?: string | null
          code_text?: string | null
          code_value?: number | null
          created_at?: string
          expiration_date?: string | null
          game_id?: string
          id?: string
          payment_status?: string | null
          price?: number
          region?: string | null
          seller_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          verification_deadline?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_codes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_codes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          game_code_id: string
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          platform_fee: number
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          game_code_id: string
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          platform_fee: number
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          game_code_id?: string
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          platform_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_game_code_id_fkey"
            columns: ["game_code_id"]
            isOneToOne: false
            referencedRelation: "game_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
