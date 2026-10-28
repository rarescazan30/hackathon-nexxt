export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
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
      monthly_jars: {
        Row: {
          accepted_amount_bani: number | null
          collected_at: string | null
          created_at: string
          float_interest_bani: number
          id: string
          invest_on: string | null
          invested_at: string | null
          month: string
          offer_message: string | null
          payment_status: string | null
          roundups_bani: number
          salary_bani: number
          status: Database["public"]["Enums"]["jar_status"]
          stripe_payment_intent_id: string | null
          total_bani: number
          user_id: string
        }
        Insert: {
          accepted_amount_bani?: number | null
          collected_at?: string | null
          created_at?: string
          float_interest_bani?: number
          id?: string
          invest_on?: string | null
          invested_at?: string | null
          month: string
          offer_message?: string | null
          payment_status?: string | null
          roundups_bani?: number
          salary_bani?: number
          status?: Database["public"]["Enums"]["jar_status"]
          stripe_payment_intent_id?: string | null
          total_bani?: number
          user_id: string
        }
        Update: {
          accepted_amount_bani?: number | null
          collected_at?: string | null
          created_at?: string
          float_interest_bani?: number
          id?: string
          invest_on?: string | null
          invested_at?: string | null
          month?: string
          offer_message?: string | null
          payment_status?: string | null
          roundups_bani?: number
          salary_bani?: number
          status?: Database["public"]["Enums"]["jar_status"]
          stripe_payment_intent_id?: string | null
          total_bani?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_jars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_bani: number
          executed_at: string
          id: string
          jar_id: string | null
          product_id: string
          unit_price_bani: number
          units: number
          user_id: string
        }
        Insert: {
          amount_bani: number
          executed_at?: string
          id?: string
          jar_id?: string | null
          product_id: string
          unit_price_bani: number
          units: number
          user_id: string
        }
        Update: {
          amount_bani?: number
          executed_at?: string
          id?: string
          jar_id?: string | null
          product_id?: string
          unit_price_bani?: number
          units?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_jar_id_fkey"
            columns: ["jar_id"]
            isOneToOne: false
            referencedRelation: "monthly_jars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_assets: {
        Row: {
          as_of: string
          balance_bani: number
          created_at: string
          id: string
          provider: string | null
          source: string
          type: Database["public"]["Enums"]["asset_type"]
          units: number | null
          user_id: string
        }
        Insert: {
          as_of: string
          balance_bani: number
          created_at?: string
          id?: string
          provider?: string | null
          source: string
          type: Database["public"]["Enums"]["asset_type"]
          units?: number | null
          user_id: string
        }
        Update: {
          as_of?: string
          balance_bani?: number
          created_at?: string
          id?: string
          provider?: string | null
          source?: string
          type?: Database["public"]["Enums"]["asset_type"]
          units?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          date: string
          product_id: string
          unit_price_bani: number
        }
        Insert: {
          date: string
          product_id: string
          unit_price_bani: number
        }
        Update: {
          date?: string
          product_id?: string
          unit_price_bani?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          description: string | null
          id: string
          name: string
          provider: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source_url: string | null
          type: Database["public"]["Enums"]["product_type"]
        }
        Insert: {
          description?: string | null
          id: string
          name: string
          provider?: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source_url?: string | null
          type: Database["public"]["Enums"]["product_type"]
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          provider?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source_url?: string | null
          type?: Database["public"]["Enums"]["product_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_year: number | null
          card_brand: string | null
          card_last4: string | null
          card_linked: boolean
          created_at: string
          full_name: string | null
          id: string
          last_seen_level: number
          monthly_cap_bani: number | null
          net_salary_bani: number | null
          onboarding_completed: boolean
          retirement_age: number
          roundup_multiplier: number
          roundup_rule_bani: number
          salary_percent_bp: number
          start_level: number | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          terms_accepted_at: string | null
          updated_at: string
          years_worked: number | null
        }
        Insert: {
          birth_year?: number | null
          card_brand?: string | null
          card_last4?: string | null
          card_linked?: boolean
          created_at?: string
          full_name?: string | null
          id: string
          last_seen_level?: number
          monthly_cap_bani?: number | null
          net_salary_bani?: number | null
          onboarding_completed?: boolean
          retirement_age?: number
          roundup_multiplier?: number
          roundup_rule_bani?: number
          salary_percent_bp?: number
          start_level?: number | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          years_worked?: number | null
        }
        Update: {
          birth_year?: number | null
          card_brand?: string | null
          card_last4?: string | null
          card_linked?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen_level?: number
          monthly_cap_bani?: number | null
          net_salary_bani?: number | null
          onboarding_completed?: boolean
          retirement_age?: number
          roundup_multiplier?: number
          roundup_rule_bani?: number
          salary_percent_bp?: number
          start_level?: number | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          years_worked?: number | null
        }
        Relationships: []
      }
      roundups: {
        Row: {
          amount_bani: number
          created_at: string
          id: string
          month: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount_bani: number
          created_at?: string
          id?: string
          month: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount_bani?: number
          created_at?: string
          id?: string
          month?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roundups_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roundups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          code: string
          first_name: string
          image_path: string | null
          level: number
          slots: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          first_name: string
          image_path?: string | null
          level: number
          slots: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          first_name?: string
          image_path?: string | null
          level?: number
          slots?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statement_uploads: {
        Row: {
          created_at: string
          error: string | null
          extracted: Json | null
          file_path: string
          id: string
          kind: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          extracted?: Json | null
          file_path: string
          id?: string
          kind?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          extracted?: Json | null
          file_path?: string
          id?: string
          kind?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "statement_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          received_at: string
          type: string
        }
        Insert: {
          id: string
          received_at?: string
          type: string
        }
        Update: {
          id?: string
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_bani: number
          booked_at: string
          counterparty: string | null
          created_at: string
          currency: string
          description: string | null
          external_id: string
          id: string
          is_card_payment: boolean
          user_id: string
        }
        Insert: {
          amount_bani: number
          booked_at: string
          counterparty?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id: string
          id?: string
          is_card_payment?: boolean
          user_id: string
        }
        Update: {
          amount_bani?: number
          booked_at?: string
          counterparty?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_id?: string
          id?: string
          is_card_payment?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      asset_type: "pillar2" | "pillar3" | "deposit" | "bonds" | "etf"
      jar_status:
        | "open"
        | "offered"
        | "accepted"
        | "collected"
        | "failed"
        | "declined"
        | "invested"
      product_type: "pillar3" | "etf" | "gov_bonds" | "deposit"
      proposal_status: "pending" | "accepted" | "changed" | "declined"
      risk_level: "low" | "medium" | "high"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asset_type: ["pillar2", "pillar3", "deposit", "bonds", "etf"],
      jar_status: [
        "open",
        "offered",
        "accepted",
        "collected",
        "failed",
        "declined",
        "invested",
      ],
      product_type: ["pillar3", "etf", "gov_bonds", "deposit"],
      proposal_status: ["pending", "accepted", "changed", "declined"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
