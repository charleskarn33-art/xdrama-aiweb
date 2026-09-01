// Hand-authored to match supabase/migrations/0001_init.sql and
// 0002_seed_model_registry.sql. Regenerate with
// `supabase gen types typescript` once a live project is linked, and keep
// this file as the source of truth until then.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectType =
  | "movie"
  | "drama"
  | "short_film"
  | "trailer"
  | "music_video"
  | "commercial"
  | "documentary";

export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";

export type AiJobStatus =
  | "QUEUED"
  | "STARTING"
  | "PREPARING"
  | "MODEL_LOADING"
  | "GENERATING"
  | "POST_PROCESSING"
  | "UPLOADING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ModelType = "video" | "image" | "audio" | "tts" | "lip_sync" | "llm";
export type ModelStatus = "active" | "beta" | "deprecated" | "unavailable";

export type CreditTransactionType =
  | "purchase"
  | "reserve"
  | "settle"
  | "refund"
  | "adjustment";

interface TableDefs {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<TableDefs["profiles"]["Row"]>;
      };
      projects: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description: string | null;
          type: ProjectType;
          genre: string | null;
          language: string | null;
          country: string | null;
          aspect_ratio: string;
          target_resolution: string;
          estimated_duration_seconds: number | null;
          cover_image_path: string | null;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["projects"]["Row"]> & {
          created_by: string;
          title: string;
          type: ProjectType;
        };
        Update: Partial<TableDefs["projects"]["Row"]>;
      };
      project_settings: {
        Row: {
          project_id: string;
          cultural_context: Json;
          default_model_id: string | null;
          default_workflow_id: string | null;
          settings: Json;
          updated_at: string;
        };
        Insert: Partial<TableDefs["project_settings"]["Row"]> & {
          project_id: string;
        };
        Update: Partial<TableDefs["project_settings"]["Row"]>;
      };
      scripts: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: Json;
          format: "richtext" | "fountain" | "plain";
          word_count: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["scripts"]["Row"]> & {
          project_id: string;
          created_by: string;
        };
        Update: Partial<TableDefs["scripts"]["Row"]>;
      };
      script_versions: {
        Row: {
          id: string;
          script_id: string;
          version_number: number;
          content: Json;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<TableDefs["script_versions"]["Row"]> & {
          script_id: string;
          version_number: number;
          content: Json;
          created_by: string;
        };
        Update: Partial<TableDefs["script_versions"]["Row"]>;
      };
      locations: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          lighting: string | null;
          weather: string | null;
          time_of_day: string | null;
          architectural_style: string | null;
          color_palette: Json;
          camera_presets: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["locations"]["Row"]> & {
          project_id: string;
          name: string;
        };
        Update: Partial<TableDefs["locations"]["Row"]>;
      };
      location_references: {
        Row: {
          id: string;
          location_id: string;
          storage_path: string;
          created_at: string;
        };
        Insert: Partial<TableDefs["location_references"]["Row"]> & {
          location_id: string;
          storage_path: string;
        };
        Update: Partial<TableDefs["location_references"]["Row"]>;
      };
      characters: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          age: string | null;
          gender: string | null;
          appearance: Json;
          personality: string | null;
          voice_id: string | null;
          negative_attributes: string | null;
          visual_style: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["characters"]["Row"]> & {
          project_id: string;
          name: string;
          created_by: string;
        };
        Update: Partial<TableDefs["characters"]["Row"]>;
      };
      character_references: {
        Row: {
          id: string;
          character_id: string;
          storage_path: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<TableDefs["character_references"]["Row"]> & {
          character_id: string;
          storage_path: string;
        };
        Update: Partial<TableDefs["character_references"]["Row"]>;
      };
      props: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          storage_path: string | null;
          created_at: string;
        };
        Insert: Partial<TableDefs["props"]["Row"]> & {
          project_id: string;
          name: string;
        };
        Update: Partial<TableDefs["props"]["Row"]>;
      };
      scenes: {
        Row: {
          id: string;
          project_id: string;
          script_id: string | null;
          location_id: string | null;
          scene_number: number;
          heading: string | null;
          int_ext: "INT" | "EXT" | "INT/EXT" | null;
          time_of_day: string | null;
          description: string | null;
          mood: string | null;
          estimated_duration_seconds: number | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["scenes"]["Row"]> & {
          project_id: string;
          scene_number: number;
        };
        Update: Partial<TableDefs["scenes"]["Row"]>;
      };
      shots: {
        Row: {
          id: string;
          scene_id: string;
          shot_number: number;
          camera_angle: string | null;
          camera_movement: string | null;
          lens: string | null;
          composition: string | null;
          prompt: string | null;
          negative_prompt: string | null;
          duration_seconds: number | null;
          order_index: number;
          status: "pending" | "generating" | "completed" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["shots"]["Row"]> & {
          scene_id: string;
          shot_number: number;
        };
        Update: Partial<TableDefs["shots"]["Row"]>;
      };
      storyboards: {
        Row: {
          id: string;
          project_id: string;
          scene_id: string | null;
          shot_id: string | null;
          frame_number: number;
          storage_path: string | null;
          camera_angle: string | null;
          camera_movement: string | null;
          lens: string | null;
          composition: string | null;
          prompt: string | null;
          negative_prompt: string | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: Partial<TableDefs["storyboards"]["Row"]> & {
          project_id: string;
        };
        Update: Partial<TableDefs["storyboards"]["Row"]>;
      };
      assets: {
        Row: {
          id: string;
          project_id: string | null;
          user_id: string;
          type:
            | "image"
            | "video"
            | "audio"
            | "character"
            | "location"
            | "prop"
            | "music"
            | "voice"
            | "storyboard";
          storage_path: string;
          file_name: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          tags: string[];
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<TableDefs["assets"]["Row"]> & {
          user_id: string;
          type: TableDefs["assets"]["Row"]["type"];
          storage_path: string;
        };
        Update: Partial<TableDefs["assets"]["Row"]>;
      };
      ai_models: {
        Row: {
          id: string;
          name: string;
          provider: string;
          version: string;
          type: ModelType;
          description: string | null;
          capabilities: string[];
          minimum_vram_gb: number | null;
          recommended_vram_gb: number | null;
          supported_resolutions: string[];
          supported_fps: number[];
          maximum_duration_seconds: number | null;
          input_types: string[];
          output_types: string[];
          status: ModelStatus;
          enabled: boolean;
          priority: number;
          cost_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["ai_models"]["Row"]> & {
          id: string;
          name: string;
          provider: string;
          version: string;
          type: ModelType;
        };
        Update: Partial<TableDefs["ai_models"]["Row"]>;
      };
      ai_workflows: {
        Row: {
          id: string;
          name: string;
          category: string;
          version: string;
          model_requirements: Json;
          input_schema: Json;
          output_schema: Json;
          parameters: Json;
          status: "active" | "beta" | "deprecated";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["ai_workflows"]["Row"]> & {
          id: string;
          name: string;
          category: string;
        };
        Update: Partial<TableDefs["ai_workflows"]["Row"]>;
      };
      ai_jobs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          scene_id: string | null;
          shot_id: string | null;
          job_type: string;
          model_id: string | null;
          workflow_id: string | null;
          provider: string;
          status: AiJobStatus;
          progress: number;
          started_at: string | null;
          completed_at: string | null;
          failed_at: string | null;
          error_message: string | null;
          input_metadata: Json;
          output_metadata: Json;
          storage_path: string | null;
          gpu_type: string | null;
          gpu_seconds: number | null;
          estimated_cost: number | null;
          actual_cost: number | null;
          credits_settled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["ai_jobs"]["Row"]> & {
          user_id: string;
          job_type: string;
        };
        Update: Partial<TableDefs["ai_jobs"]["Row"]>;
      };
      ai_job_events: {
        Row: {
          id: string;
          job_id: string;
          status: string;
          message: string | null;
          progress: number | null;
          created_at: string;
        };
        Insert: Partial<TableDefs["ai_job_events"]["Row"]> & {
          job_id: string;
          status: string;
        };
        Update: Partial<TableDefs["ai_job_events"]["Row"]>;
      };
      render_jobs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          timeline_snapshot: Json;
          output_format: string;
          resolution: string;
          fps: number;
          codec: string;
          status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
          progress: number;
          storage_path: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<TableDefs["render_jobs"]["Row"]> & {
          project_id: string;
          user_id: string;
        };
        Update: Partial<TableDefs["render_jobs"]["Row"]>;
      };
      timelines: {
        Row: {
          project_id: string;
          tracks: Json;
          updated_at: string;
        };
        Insert: Partial<TableDefs["timelines"]["Row"]> & {
          project_id: string;
        };
        Update: Partial<TableDefs["timelines"]["Row"]>;
      };
      exports: {
        Row: {
          id: string;
          project_id: string;
          render_job_id: string | null;
          platform_preset: string | null;
          format: string;
          resolution: string;
          fps: number;
          codec: string;
          storage_path: string | null;
          file_size_bytes: number | null;
          status: "PENDING" | "READY" | "FAILED";
          created_at: string;
        };
        Insert: Partial<TableDefs["exports"]["Row"]> & {
          project_id: string;
        };
        Update: Partial<TableDefs["exports"]["Row"]>;
      };
      credit_wallets: {
        Row: {
          user_id: string;
          available_credits: number;
          used_credits: number;
          reserved_credits: number;
          updated_at: string;
        };
        Insert: Partial<TableDefs["credit_wallets"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<TableDefs["credit_wallets"]["Row"]>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          type: CreditTransactionType;
          amount: number;
          balance_after: number;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<TableDefs["credit_transactions"]["Row"]> & {
          user_id: string;
          type: CreditTransactionType;
          amount: number;
          balance_after: number;
        };
        Update: Partial<TableDefs["credit_transactions"]["Row"]>;
      };
      credit_packages: {
        Row: {
          id: string;
          name: string;
          credits: number;
          price_cents: number;
          currency: string;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<TableDefs["credit_packages"]["Row"]> & {
          name: string;
          credits: number;
          price_cents: number;
        };
        Update: Partial<TableDefs["credit_packages"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<TableDefs["notifications"]["Row"]> & {
          user_id: string;
          type: string;
          title: string;
        };
        Update: Partial<TableDefs["notifications"]["Row"]>;
      };
      user_settings: {
        Row: {
          user_id: string;
          preferences: Json;
          updated_at: string;
        };
        Insert: Partial<TableDefs["user_settings"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<TableDefs["user_settings"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<TableDefs["audit_logs"]["Row"]> & {
          action: string;
        };
        Update: Partial<TableDefs["audit_logs"]["Row"]>;
      };
}

type Tables = {
  [K in keyof TableDefs]: TableDefs[K] & { Relationships: [] };
};

interface FunctionDefs {
  reserve_credits: {
    Args: { p_user_id: string; p_amount: number; p_job_id: string };
    Returns: undefined;
  };
  settle_job_credits: {
    Args: { p_job_id: string; p_actual_cost: number };
    Returns: undefined;
  };
  refund_reserved_credits: {
    Args: { p_job_id: string };
    Returns: undefined;
  };
}

// Plain interfaces with fixed keys don't get an implicit index signature,
// so they fail supabase-js's `Schema extends GenericSchema` check (which
// needs Functions assignable to Record<string, GenericFunction>) — silently
// collapsing every table's type to `never`. Mapping over the keys (as with
// `Tables` above) gives TS that implicit index signature.
type Functions = { [K in keyof FunctionDefs]: FunctionDefs[K] };

export interface Database {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Functions;
  };
}
