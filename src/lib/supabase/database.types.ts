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
          key_prefix: string | null
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
          key_prefix?: string | null
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
          key_prefix?: string | null
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
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
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
          actor_email?: string | null
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
          actor_email?: string | null
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
      collection_members: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          order: number
          ref_id: string
          ref_type: Database["public"]["Enums"]["catalog_ref_type"]
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          order?: number
          ref_id: string
          ref_type: Database["public"]["Enums"]["catalog_ref_type"]
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          order?: number
          ref_id?: string
          ref_type?: Database["public"]["Enums"]["catalog_ref_type"]
        }
        Relationships: [
          {
            foreignKeyName: "collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order: number
          parent_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["collection_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order?: number
          parent_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["collection_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
          parent_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["collection_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          cautions: Json
          composition: Json
          cost: number | null
          created_at: string
          description: string | null
          external_ref: string | null
          id: string
          is_glp1: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          pharmaceutical_form: Database["public"]["Enums"]["pharmaceutical_form"]
          price: number
          sells_standalone: boolean
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          supplier_id: string
          synced_at: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          cautions?: Json
          composition?: Json
          cost?: number | null
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          is_glp1?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          name: string
          pharmaceutical_form?: Database["public"]["Enums"]["pharmaceutical_form"]
          price?: number
          sells_standalone?: boolean
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          supplier_id: string
          synced_at?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          cautions?: Json
          composition?: Json
          cost?: number | null
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          is_glp1?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          name?: string
          pharmaceutical_form?: Database["public"]["Enums"]["pharmaceutical_form"]
          price?: number
          sells_standalone?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          supplier_id?: string
          synced_at?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      order_lines: {
        Row: {
          created_at: string
          id: string
          name_snapshot: string
          order_id: string
          quantity: number
          ref_id: string
          ref_type: Database["public"]["Enums"]["catalog_ref_type"]
          supplier_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_snapshot: string
          order_id: string
          quantity?: number
          ref_id: string
          ref_type: Database["public"]["Enums"]["catalog_ref_type"]
          supplier_id?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_snapshot?: string
          order_id?: string
          quantity?: number
          ref_id?: string
          ref_type?: Database["public"]["Enums"]["catalog_ref_type"]
          supplier_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          botane_order_ref: string | null
          created_at: string
          id: string
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
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
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
      protocol_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          order: number
          protocol_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          order?: number
          protocol_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          order?: number
          protocol_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "protocol_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_items_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_versions: {
        Row: {
          id: string
          protocol_id: string
          published_at: string
          published_by: string | null
          snapshot: Json
          version: number
        }
        Insert: {
          id?: string
          protocol_id: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          version: number
        }
        Update: {
          id?: string
          protocol_id?: string
          published_at?: string
          published_by?: string | null
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "protocol_versions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users_internal"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          claim_internal: string | null
          claim_public: string | null
          claim_reviewed_at: string | null
          claim_reviewed_by: string | null
          claim_status: Database["public"]["Enums"]["claim_status"]
          clinical_description: string | null
          created_at: string
          id: string
          name: string
          page_content: Json
          price: number
          price_source: Database["public"]["Enums"]["price_source"]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          version: number
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          claim_internal?: string | null
          claim_public?: string | null
          claim_reviewed_at?: string | null
          claim_reviewed_by?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          clinical_description?: string | null
          created_at?: string
          id?: string
          name: string
          page_content?: Json
          price?: number
          price_source?: Database["public"]["Enums"]["price_source"]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          claim_internal?: string | null
          claim_public?: string | null
          claim_reviewed_at?: string | null
          claim_reviewed_by?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          clinical_description?: string | null
          created_at?: string
          id?: string
          name?: string
          page_content?: Json
          price?: number
          price_source?: Database["public"]["Enums"]["price_source"]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "protocols_claim_reviewed_by_fkey"
            columns: ["claim_reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_internal"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_lines: {
        Row: {
          created_at: string
          id: string
          quantity: number
          ref_id: string
          ref_type: Database["public"]["Enums"]["catalog_ref_type"]
          subscription_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          ref_id: string
          ref_type: Database["public"]["Enums"]["catalog_ref_type"]
          subscription_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          ref_id?: string
          ref_type?: Database["public"]["Enums"]["catalog_ref_type"]
          subscription_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_lines_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      suppliers: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          status: string
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          type: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
        }
        Relationships: []
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
      catalog_ref_type: "item" | "protocol"
      claim_status: "draft" | "pending_review" | "approved" | "rejected"
      collection_visibility: "public" | "internal"
      commercial_ref_type: "plan" | "formula"
      content_status: "draft" | "published"
      item_type: "manipulado" | "medicamento" | "suplemento" | "servico"
      order_item_ref_type: "plan" | "formula" | "product"
      order_status:
        | "paid"
        | "in_production"
        | "shipped"
        | "delivered"
        | "failed"
      payment_status: "paid" | "pending" | "failed" | "refunded"
      pharmaceutical_form:
        | "capsula"
        | "sache"
        | "sublingual"
        | "topico"
        | "outro"
        | "na"
      price_source: "sum" | "manual"
      subscription_status: "active" | "paused" | "canceled" | "past_due"
      supplier: "botane" | "partner"
      supplier_type: "pharmacy" | "partner" | "internal"
      sync_direction: "import" | "order"
      sync_status: "success" | "partial" | "failed"
      visibility: "public" | "medical_only"
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
      catalog_ref_type: ["item", "protocol"],
      claim_status: ["draft", "pending_review", "approved", "rejected"],
      collection_visibility: ["public", "internal"],
      commercial_ref_type: ["plan", "formula"],
      content_status: ["draft", "published"],
      item_type: ["manipulado", "medicamento", "suplemento", "servico"],
      order_item_ref_type: ["plan", "formula", "product"],
      order_status: ["paid", "in_production", "shipped", "delivered", "failed"],
      payment_status: ["paid", "pending", "failed", "refunded"],
      pharmaceutical_form: [
        "capsula",
        "sache",
        "sublingual",
        "topico",
        "outro",
        "na",
      ],
      price_source: ["sum", "manual"],
      subscription_status: ["active", "paused", "canceled", "past_due"],
      supplier: ["botane", "partner"],
      supplier_type: ["pharmacy", "partner", "internal"],
      sync_direction: ["import", "order"],
      sync_status: ["success", "partial", "failed"],
      visibility: ["public", "medical_only"],
    },
  },
} as const
