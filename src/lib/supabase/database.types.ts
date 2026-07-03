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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anamnesis_forms: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      anamnesis_questions: {
        Row: {
          conditional_logic: Json
          created_at: string
          form_id: string
          id: string
          label: string
          options: Json
          order: number
          required: boolean
          risk_weight: number
          type: string
          updated_at: string
        }
        Insert: {
          conditional_logic?: Json
          created_at?: string
          form_id: string
          id?: string
          label: string
          options?: Json
          order?: number
          required?: boolean
          risk_weight?: number
          type?: string
          updated_at?: string
        }
        Update: {
          conditional_logic?: Json
          created_at?: string
          form_id?: string
          id?: string
          label?: string
          options?: Json
          order?: number
          required?: boolean
          risk_weight?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          scope: string
          status: Database["public"]["Enums"]["api_key_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          scope?: string
          status?: Database["public"]["Enums"]["api_key_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          scope?: string
          status?: Database["public"]["Enums"]["api_key_status"]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_internal"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          scope: Database["public"]["Enums"]["attribute_scope"]
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          scope: Database["public"]["Enums"]["attribute_scope"]
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          scope?: Database["public"]["Enums"]["attribute_scope"]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
        }
        Relationships: []
      }
      botane_sync_log: {
        Row: {
          details: Json
          direction: Database["public"]["Enums"]["sync_direction"]
          id: string
          items_failed: number
          items_processed: number
          run_at: string
          status: Database["public"]["Enums"]["sync_status"]
        }
        Insert: {
          details?: Json
          direction: Database["public"]["Enums"]["sync_direction"]
          id?: string
          items_failed?: number
          items_processed?: number
          run_at?: string
          status: Database["public"]["Enums"]["sync_status"]
        }
        Update: {
          details?: Json
          direction?: Database["public"]["Enums"]["sync_direction"]
          id?: string
          items_failed?: number
          items_processed?: number
          run_at?: string
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Relationships: []
      }
      commercial_products: {
        Row: {
          created_at: string
          id: string
          is_addon: boolean
          name: string
          price: number
          ref_id: string | null
          ref_type: Database["public"]["Enums"]["commercial_ref_type"]
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_addon?: boolean
          name: string
          price?: number
          ref_id?: string | null
          ref_type: Database["public"]["Enums"]["commercial_ref_type"]
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_addon?: boolean
          name?: string
          price?: number
          ref_id?: string | null
          ref_type?: Database["public"]["Enums"]["commercial_ref_type"]
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      entity_attributes: {
        Row: {
          attribute_id: string
          entity_id: string
          entity_type: string
          id: string
          value: Json | null
        }
        Insert: {
          attribute_id: string
          entity_id: string
          entity_type: string
          id?: string
          value?: Json | null
        }
        Update: {
          attribute_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      formulas: {
        Row: {
          created_at: string
          dosage: string | null
          eligibility_rules: Json
          external_ref: string | null
          id: string
          is_glp1: boolean
          name: string
          pharmaceutical_form: Database["public"]["Enums"]["pharmaceutical_form"]
          protocol_id: string | null
          supplier: Database["public"]["Enums"]["supplier"]
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          eligibility_rules?: Json
          external_ref?: string | null
          id?: string
          is_glp1?: boolean
          name: string
          pharmaceutical_form?: Database["public"]["Enums"]["pharmaceutical_form"]
          protocol_id?: string | null
          supplier?: Database["public"]["Enums"]["supplier"]
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          eligibility_rules?: Json
          external_ref?: string | null
          id?: string
          is_glp1?: boolean
          name?: string
          pharmaceutical_form?: Database["public"]["Enums"]["pharmaceutical_form"]
          protocol_id?: string | null
          supplier?: Database["public"]["Enums"]["supplier"]
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formulas_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          content: Json
          created_at: string
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          at: string
          created_at: string
          description: string | null
          id: string
          label: string
          order_id: string
        }
        Insert: {
          at?: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          order_id: string
        }
        Update: {
          at?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          is_glp1: boolean
          name: string
          order_id: string
          quantity: number
          ref_id: string | null
          ref_type: Database["public"]["Enums"]["order_item_ref_type"]
          supplier: Database["public"]["Enums"]["supplier"] | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_glp1?: boolean
          name: string
          order_id: string
          quantity?: number
          ref_id?: string | null
          ref_type: Database["public"]["Enums"]["order_item_ref_type"]
          supplier?: Database["public"]["Enums"]["supplier"] | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_glp1?: boolean
          name?: string
          order_id?: string
          quantity?: number
          ref_id?: string | null
          ref_type?: Database["public"]["Enums"]["order_item_ref_type"]
          supplier?: Database["public"]["Enums"]["supplier"] | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          botane_order_ref: string | null
          created_at: string
          id: string
          journey_id: string | null
          patient_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan_id: string | null
          prescription_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          botane_order_ref?: string | null
          created_at?: string
          id?: string
          journey_id?: string | null
          patient_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id?: string | null
          prescription_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          botane_order_ref?: string | null
          created_at?: string
          id?: string
          journey_id?: string | null
          patient_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id?: string | null
          prescription_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          auth_user_id: string | null
          clinical_profile: Json
          consent_status: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          clinical_profile?: Json
          consent_status?: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          clinical_profile?: Json
          consent_status?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          base_price: number
          billing_interval: string
          created_at: string
          id: string
          inclusions: Json
          journey_id: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          base_price?: number
          billing_interval?: string
          created_at?: string
          id?: string
          inclusions?: Json
          journey_id?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          base_price?: number
          billing_interval?: string
          created_at?: string
          id?: string
          inclusions?: Json
          journey_id?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          code: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["content_status"]
          type: string
          valid_from: string | null
          valid_to: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          type: string
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          type?: string
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Relationships: []
      }
      protocols: {
        Row: {
          clinical_description: string | null
          created_at: string
          external_ref: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          clinical_description?: string | null
          created_at?: string
          external_ref?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          clinical_description?: string | null
          created_at?: string
          external_ref?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          patient_id: string
          payment_provider_ref: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          patient_id: string
          payment_provider_ref?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          patient_id?: string
          payment_provider_ref?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users_internal: {
        Row: {
          created_at: string
          email: string
          id: string
          mfa_enabled: boolean
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          mfa_enabled?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mfa_enabled?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: { roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      api_key_status: "active" | "revoked"
      app_role: "super_admin" | "catalog_admin" | "doctor" | "operator"
      attribute_scope: "catalog" | "protocol" | "journey"
      commercial_ref_type: "plan" | "formula"
      content_status: "draft" | "published"
      order_item_ref_type: "plan" | "formula" | "product"
      order_status:
        | "paid"
        | "in_production"
        | "shipped"
        | "delivered"
        | "failed"
      payment_status: "paid" | "pending" | "failed" | "refunded"
      pharmaceutical_form:
        | "capsule"
        | "sachet"
        | "sublingual"
        | "topical"
        | "other"
      subscription_status: "active" | "paused" | "canceled" | "past_due"
      supplier: "botane" | "partner"
      sync_direction: "import" | "order"
      sync_status: "success" | "partial" | "failed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      api_key_status: ["active", "revoked"],
      app_role: ["super_admin", "catalog_admin", "doctor", "operator"],
      attribute_scope: ["catalog", "protocol", "journey"],
      commercial_ref_type: ["plan", "formula"],
      content_status: ["draft", "published"],
      order_item_ref_type: ["plan", "formula", "product"],
      order_status: ["paid", "in_production", "shipped", "delivered", "failed"],
      payment_status: ["paid", "pending", "failed", "refunded"],
      pharmaceutical_form: [
        "capsule",
        "sachet",
        "sublingual",
        "topical",
        "other",
      ],
      subscription_status: ["active", "paused", "canceled", "past_due"],
      supplier: ["botane", "partner"],
      sync_direction: ["import", "order"],
      sync_status: ["success", "partial", "failed"],
    },
  },
} as const
