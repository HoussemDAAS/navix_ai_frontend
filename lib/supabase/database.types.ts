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
      analysis_briefs: {
        Row: {
          dominant_formats: Json | null
          generated_at: string | null
          id: string
          project_id: string
          whitespace_opportunities: Json | null
          winning_hooks: Json | null
        }
        Insert: {
          dominant_formats?: Json | null
          generated_at?: string | null
          id?: string
          project_id: string
          whitespace_opportunities?: Json | null
          winning_hooks?: Json | null
        }
        Update: {
          dominant_formats?: Json | null
          generated_at?: string | null
          id?: string
          project_id?: string
          whitespace_opportunities?: Json | null
          winning_hooks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          constraints: string[] | null
          formality_level: string | null
          id: string
          objective: string | null
          preferred_cta: string | null
          project_id: string
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string | null
          vocab_exclude: string | null
        }
        Insert: {
          constraints?: string[] | null
          formality_level?: string | null
          id?: string
          objective?: string | null
          preferred_cta?: string | null
          project_id: string
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          vocab_exclude?: string | null
        }
        Update: {
          constraints?: string[] | null
          formality_level?: string | null
          id?: string
          objective?: string | null
          preferred_cta?: string | null
          project_id?: string
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          vocab_exclude?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          avatar_url: string | null
          biography: string | null
          confidence_score: number | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          handle: string
          id: string
          inclusion_reason: string | null
          platform: string
          posts_count: number | null
          project_id: string | null
          rejected_by_user: boolean | null
          validated_by_user: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          biography?: string | null
          confidence_score?: number | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          handle: string
          id?: string
          inclusion_reason?: string | null
          platform: string
          posts_count?: number | null
          project_id?: string | null
          rejected_by_user?: boolean | null
          validated_by_user?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          biography?: string | null
          confidence_score?: number | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          handle?: string
          id?: string
          inclusion_reason?: string | null
          platform?: string
          posts_count?: number | null
          project_id?: string | null
          rejected_by_user?: boolean | null
          validated_by_user?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_directions: {
        Row: {
          angle: string | null
          brief_id: string
          created_at: string | null
          format: string | null
          id: string
          rationale: string | null
          title_pillar: string
        }
        Insert: {
          angle?: string | null
          brief_id: string
          created_at?: string | null
          format?: string | null
          id?: string
          rationale?: string | null
          title_pillar: string
        }
        Update: {
          angle?: string | null
          brief_id?: string
          created_at?: string | null
          format?: string | null
          id?: string
          rationale?: string | null
          title_pillar?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_directions_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "analysis_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          caption_text: string | null
          created_at: string | null
          direction_id: string
          id: string
          status: string | null
          user_feedback_notes: string | null
          video_script: string | null
        }
        Insert: {
          caption_text?: string | null
          created_at?: string | null
          direction_id: string
          id?: string
          status?: string | null
          user_feedback_notes?: string | null
          video_script?: string | null
        }
        Update: {
          caption_text?: string | null
          created_at?: string | null
          direction_id?: string
          id?: string
          status?: string | null
          user_feedback_notes?: string | null
          video_script?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drafts_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "content_directions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          location: string
          name: string | null
          niche: string
          persona: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          name?: string | null
          niche: string
          persona?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          name?: string | null
          niche?: string
          persona?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          caption: string | null
          competitor_id: string | null
          created_at: string | null
          external_id: string
          id: string
          likes_count: number | null
          published_at: string | null
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          competitor_id?: string | null
          created_at?: string | null
          external_id: string
          id?: string
          likes_count?: number | null
          published_at?: string | null
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          competitor_id?: string | null
          created_at?: string | null
          external_id?: string
          id?: string
          likes_count?: number | null
          published_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName]["Update"]
