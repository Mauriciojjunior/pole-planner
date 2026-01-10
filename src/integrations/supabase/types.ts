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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string | null
          ends_at: string
          id: string
          is_recurring: boolean | null
          reason: string | null
          recurrence_rule: string | null
          starts_at: string
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurrence_rule?: string | null
          starts_at: string
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurrence_rule?: string | null
          starts_at?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          attended: boolean | null
          booked_at: string | null
          cancelled_at: string | null
          class_id: string
          created_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          student_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attended?: boolean | null
          booked_at?: string | null
          cancelled_at?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attended?: boolean | null
          booked_at?: string | null
          cancelled_at?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_students: number
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_students?: number
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_students?: number
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          cancelled_reason: string | null
          class_type_id: string
          created_at: string | null
          ends_at: string
          event_type: string | null
          id: string
          is_cancelled: boolean | null
          is_recurring: boolean | null
          max_students: number
          notes: string | null
          recurrence_rule: string | null
          schedule_id: string | null
          starts_at: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cancelled_reason?: string | null
          class_type_id: string
          created_at?: string | null
          ends_at: string
          event_type?: string | null
          id?: string
          is_cancelled?: boolean | null
          is_recurring?: boolean | null
          max_students: number
          notes?: string | null
          recurrence_rule?: string | null
          schedule_id?: string | null
          starts_at: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cancelled_reason?: string | null
          class_type_id?: string
          created_at?: string | null
          ends_at?: string
          event_type?: string | null
          id?: string
          is_cancelled?: boolean | null
          is_recurring?: boolean | null
          max_students?: number
          notes?: string | null
          recurrence_rule?: string | null
          schedule_id?: string | null
          starts_at?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          max_attempts: number | null
          payload: Json
          priority: number | null
          result: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          tenant_id: string | null
          type: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          max_attempts?: number | null
          payload?: Json
          priority?: number | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          tenant_id?: string | null
          type: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          max_attempts?: number | null
          payload?: Json
          priority?: number | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          profile_id: string
          read_at: string | null
          sent_at: string | null
          tenant_id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          channel?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          profile_id: string
          read_at?: string | null
          sent_at?: string | null
          tenant_id: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          channel?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          profile_id?: string
          read_at?: string | null
          sent_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          profile_id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          profile_id: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          profile_id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          classes_per_month: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          price_cents: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tenant_id: string
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          classes_per_month?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          price_cents: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id: string
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          classes_per_month?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          price_cents?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tenant_id?: string
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          external_auth_id: string | null
          id: string
          mfa_enabled: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          external_auth_id?: string | null
          id?: string
          mfa_enabled?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          external_auth_id?: string | null
          id?: string
          mfa_enabled?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          class_type_id: string
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_students: number | null
          start_time: string
          tenant_id: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          class_type_id: string
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_students?: number | null
          start_time: string
          tenant_id: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          class_type_id?: string
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_students?: number | null
          start_time?: string
          tenant_id?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          profile_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          classes_remaining: number | null
          created_at: string | null
          ends_at: string
          id: string
          is_trial: boolean | null
          metadata: Json | null
          next_billing_date: string | null
          payment_method: string | null
          plan_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          student_id: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          classes_remaining?: number | null
          created_at?: string | null
          ends_at: string
          id?: string
          is_trial?: boolean | null
          metadata?: Json | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_id: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          classes_remaining?: number | null
          created_at?: string | null
          ends_at?: string
          id?: string
          is_trial?: boolean | null
          metadata?: Json | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_id?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address_encrypted: string | null
          approval_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          currency: string | null
          document_verified: boolean | null
          email: string
          id: string
          is_active: boolean | null
          is_phone_public: boolean | null
          is_price_public: boolean | null
          name: string
          phone: string | null
          phone_encrypted: string | null
          portfolio_url: string | null
          price_cents: number | null
          sales_message_template: string | null
          settings: Json | null
          slug: string
          specialties: string[] | null
          timezone: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address_encrypted?: string | null
          approval_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          document_verified?: boolean | null
          email: string
          id?: string
          is_active?: boolean | null
          is_phone_public?: boolean | null
          is_price_public?: boolean | null
          name: string
          phone?: string | null
          phone_encrypted?: string | null
          portfolio_url?: string | null
          price_cents?: number | null
          sales_message_template?: string | null
          settings?: Json | null
          slug: string
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address_encrypted?: string | null
          approval_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          document_verified?: boolean | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_phone_public?: boolean | null
          is_price_public?: boolean | null
          name?: string
          phone?: string | null
          phone_encrypted?: string | null
          portfolio_url?: string | null
          price_cents?: number | null
          sales_message_template?: string | null
          settings?: Json | null
          slug?: string
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_block: {
        Args: { p_ends_at: string; p_starts_at: string; p_tenant_id: string }
        Returns: Json
      }
      cancel_booking_by_student: {
        Args: { p_booking_id: string; p_reason?: string; p_student_id: string }
        Returns: Json
      }
      cancel_subscription: {
        Args: {
          p_immediate?: boolean
          p_reason?: string
          p_subscription_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      create_booking_with_lock: {
        Args: {
          p_auto_approve?: boolean
          p_class_id: string
          p_notes?: string
          p_student_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      create_bulk_bookings: {
        Args: {
          p_class_ids: string[]
          p_notes?: string
          p_student_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      create_subscription: {
        Args: {
          p_plan_id: string
          p_start_trial?: boolean
          p_student_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      detect_schedule_conflicts: {
        Args: {
          p_ends_at: string
          p_exclude_block_id?: string
          p_exclude_class_id?: string
          p_starts_at: string
          p_tenant_id: string
        }
        Returns: {
          conflict_details: Json
          conflict_ends_at: string
          conflict_id: string
          conflict_starts_at: string
          conflict_type: string
        }[]
      }
      expand_schedule_to_classes: {
        Args: { p_from_date: string; p_schedule_id: string; p_to_date: string }
        Returns: number
      }
      get_availability_slots: {
        Args: {
          p_from_date: string
          p_tenant_id: string
          p_timezone?: string
          p_to_date: string
        }
        Returns: {
          available_spots: number
          class_type_id: string
          class_type_name: string
          current_bookings: number
          is_available: boolean
          max_students: number
          slot_date: string
          slot_end: string
          slot_ends_at: string
          slot_start: string
          slot_starts_at: string
          source_id: string
          source_type: string
        }[]
      }
      get_current_profile_id: { Args: never; Returns: string }
      get_current_tenant_id: { Args: never; Returns: string }
      get_public_teacher_profile: {
        Args: { teacher_slug: string }
        Returns: Json
      }
      get_student_subscription: {
        Args: { p_student_id: string; p_tenant_id: string }
        Returns: Json
      }
      get_teacher_profile_for_student: {
        Args: { student_profile_id: string; teacher_id: string }
        Returns: Json
      }
      get_whatsapp_sales_link: {
        Args: {
          p_plan_id: string
          p_student_name?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      has_active_subscription: {
        Args: { p_student_id: string; p_tenant_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _profile_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _profile_id: string }; Returns: boolean }
      renew_subscription: {
        Args: { p_subscription_id: string; p_tenant_id: string }
        Returns: Json
      }
      time_ranges_overlap: {
        Args: { end1: string; end2: string; start1: string; start2: string }
        Returns: boolean
      }
      update_booking_status: {
        Args: {
          p_actor_id: string
          p_booking_id: string
          p_new_status: Database["public"]["Enums"]["booking_status"]
          p_reason?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      urlencode: { Args: { "": string }; Returns: string }
      use_subscription_class: {
        Args: { p_subscription_id: string; p_tenant_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      job_status: "pending" | "processing" | "completed" | "failed" | "dead"
      plan_type: "monthly" | "quarterly" | "semiannual" | "custom"
      subscription_status: "active" | "paused" | "cancelled" | "expired"
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
      app_role: ["admin", "teacher", "student"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      job_status: ["pending", "processing", "completed", "failed", "dead"],
      plan_type: ["monthly", "quarterly", "semiannual", "custom"],
      subscription_status: ["active", "paused", "cancelled", "expired"],
    },
  },
} as const
