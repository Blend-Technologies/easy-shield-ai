Initialising login role...
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
    PostgrestVersion: "14.4"
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
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string
          hook: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          hook?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          hook?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          event_date: string
          id: string
          image_url: string | null
          max_attendees: number | null
          meeting_link: string | null
          meeting_platform: string | null
          organizer_name: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          event_date: string
          id?: string
          image_url?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          meeting_platform?: string | null
          organizer_name?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          event_date?: string
          id?: string
          image_url?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          meeting_platform?: string | null
          organizer_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          email: string
          full_name: string
          id: string
          joined_at: string | null
        }
        Insert: {
          community_id: string
          email: string
          full_name: string
          id?: string
          joined_at?: string | null
        }
        Update: {
          community_id?: string
          email?: string
          full_name?: string
          id?: string
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          body: string
          bookmarked: boolean
          channel: string
          created_at: string
          id: string
          image_url: string | null
          likes: number
          pinned: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          bookmarked?: boolean
          channel?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number
          pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          bookmarked?: boolean
          channel?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number
          pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_items: {
        Row: {
          article_url: string | null
          content: string | null
          created_at: string
          id: string
          media_type: string | null
          position: number
          section_id: string
          title: string
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          article_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          position?: number
          section_id: string
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          article_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          position?: number
          section_id?: string
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          content_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          lesson_count: number
          logo_url: string | null
          objectives: Json | null
          subtitle: string
          title: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          content_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          lesson_count?: number
          logo_url?: string | null
          objectives?: Json | null
          subtitle?: string
          title: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          lesson_count?: number
          logo_url?: string | null
          objectives?: Json | null
          subtitle?: string
          title?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      diagrams: {
        Row: {
          created_at: string
          edges: Json
          id: string
          nodes: Json
          source: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          source?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          source?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_name: string
          embedding: string | null
          id: number
          session_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          document_name: string
          embedding?: string | null
          id?: number
          session_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_name?: string
          embedding?: string | null
          id?: number
          session_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "community_events"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      knowledge_base_chunks: {
        Row: {
          category: string
          chunk_index: number
          content: string
          created_at: string
          document_name: string
          embedding: string | null
          id: number
        }
        Insert: {
          category?: string
          chunk_index?: number
          content: string
          created_at?: string
          document_name: string
          embedding?: string | null
          id?: number
        }
        Update: {
          category?: string
          chunk_index?: number
          content?: string
          created_at?: string
          document_name?: string
          embedding?: string | null
          id?: number
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          location: string | null
          online: boolean | null
          title: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          location?: string | null
          online?: boolean | null
          title?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          online?: boolean | null
          title?: string | null
          website?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string
          evaluation_result: Json | null
          id: string
          model: string
          project_description: string | null
          project_title: string
          proposal_content: string | null
          proposal_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evaluation_result?: Json | null
          id?: string
          model?: string
          project_description?: string | null
          project_title?: string
          proposal_content?: string | null
          proposal_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evaluation_result?: Json | null
          id?: string
          model?: string
          project_description?: string | null
          project_title?: string
          proposal_content?: string | null
          proposal_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spark_activity: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spark_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_projects: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_favorite: boolean
          name: string
          priority: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          priority?: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          priority?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spark_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          phase: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase?: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spark_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          project_id: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          project_id?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          project_id?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spark_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spark_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_items: {
        Row: {
          assignee_initials: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          sprint_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_initials?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          sprint_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_initials?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          sprint_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "spark_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member_or_creator: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
