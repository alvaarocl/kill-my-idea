export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      analyses: {
        Row: {
          business_model: string | null;
          competition: string | null;
          context: string | null;
          created_at: string;
          id: string;
          idea: string;
          lang: string;
          market: string | null;
          one_liner: string | null;
          paddle_transaction_id: string | null;
          problem: string | null;
          result_json: Json;
          score: number | null;
          stage: string | null;
          target_customer: string | null;
          team: string | null;
          unlocked: boolean;
          unlocked_at: string | null;
          user_id: string;
          verdict: string | null;
        };
        Insert: {
          business_model?: string | null;
          competition?: string | null;
          context?: string | null;
          created_at?: string;
          id?: string;
          idea: string;
          lang?: string;
          market?: string | null;
          one_liner?: string | null;
          paddle_transaction_id?: string | null;
          problem?: string | null;
          result_json: Json;
          score?: number | null;
          stage?: string | null;
          target_customer?: string | null;
          team?: string | null;
          unlocked?: boolean;
          unlocked_at?: string | null;
          user_id: string;
          verdict?: string | null;
        };
        Update: {
          business_model?: string | null;
          competition?: string | null;
          context?: string | null;
          created_at?: string;
          id?: string;
          idea?: string;
          lang?: string;
          market?: string | null;
          one_liner?: string | null;
          paddle_transaction_id?: string | null;
          problem?: string | null;
          result_json?: Json;
          score?: number | null;
          stage?: string | null;
          target_customer?: string | null;
          team?: string | null;
          unlocked?: boolean;
          unlocked_at?: string | null;
          user_id?: string;
          verdict?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          environment: string;
          event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          environment: string;
          event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          environment?: string;
          event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      one_time_purchases: {
        Row: {
          amount_cents: number;
          analysis_id: string | null;
          created_at: string;
          currency: string;
          environment: string;
          id: string;
          paddle_customer_id: string | null;
          paddle_transaction_id: string;
          price_id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          analysis_id?: string | null;
          created_at?: string;
          currency: string;
          environment?: string;
          id?: string;
          paddle_customer_id?: string | null;
          paddle_transaction_id: string;
          price_id: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          analysis_id?: string | null;
          created_at?: string;
          currency?: string;
          environment?: string;
          id?: string;
          paddle_customer_id?: string | null;
          paddle_transaction_id?: string;
          price_id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "one_time_purchases_analysis_id_fkey";
            columns: ["analysis_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          key_hash: string;
          updated_at: string;
          window_start: string;
        };
        Insert: {
          count?: number;
          key_hash: string;
          updated_at?: string;
          window_start: string;
        };
        Update: {
          count?: number;
          key_hash?: string;
          updated_at?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          environment: string;
          id: string;
          paddle_customer_id: string;
          paddle_subscription_id: string;
          price_id: string;
          product_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          environment?: string;
          id?: string;
          paddle_customer_id: string;
          paddle_subscription_id: string;
          price_id: string;
          product_id: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          environment?: string;
          id?: string;
          paddle_customer_id?: string;
          paddle_subscription_id?: string;
          price_id?: string;
          product_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      usage_counters: {
        Row: {
          analyses_used: number;
          period_start: string;
          user_id: string;
        };
        Insert: {
          analyses_used?: number;
          period_start: string;
          user_id: string;
        };
        Update: {
          analyses_used?: number;
          period_start?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_admin_top_users: {
        Args: { limit_count?: number };
        Returns: {
          analyses: number;
          user_id: string;
        }[];
      };
      get_user_plan: {
        Args: { check_env?: string; user_uuid: string };
        Returns: string;
      };
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      release_analysis_quota: {
        Args: { period_start_date: string; user_uuid: string };
        Returns: number | null;
      };
      reserve_analysis_quota: {
        Args: {
          period_start_date: string;
          quota_limit: number;
          user_uuid: string;
        };
        Returns: number | null;
      };
      reserve_rate_limit: {
        Args: {
          limit_key_hash: string;
          max_requests: number;
          window_seconds: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      plan_tier: "free" | "founder" | "pro";
      subscription_status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      plan_tier: ["free", "founder", "pro"],
      subscription_status: ["active", "trialing", "past_due", "canceled", "incomplete"],
    },
  },
} as const;
