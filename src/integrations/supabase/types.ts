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
      games: {
        Row: {
          id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
        }
      }
      game_codes: {
        Row: {
          id: string
          game_id: string
          seller_id: string
          price: number
          code_text: string | null
          code_image_url: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          seller_id: string
          price: number
          code_text?: string | null
          code_image_url?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          seller_id?: string
          price?: number
          code_text?: string | null
          code_image_url?: string | null
          status?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string
          email: string | null
          full_name: string | null
        }
        Insert: {
          id: string
          updated_at?: string
          email?: string | null
          full_name?: string | null
        }
        Update: {
          id?: string
          updated_at?: string
          email?: string | null
          full_name?: string | null
        }
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