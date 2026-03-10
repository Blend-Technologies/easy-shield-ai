import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Team = {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  created_by: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export const useTeams = (projectId?: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", projectId],
    queryFn: async () => {
      let query = supabase.from("teams").select("*").order("created_at", { ascending: true });
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!projectId,
  });

  const createTeam = useMutation({
    mutationFn: async ({ name, color, projectId: pId }: { name: string; color: string; projectId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data, error } = await supabase.from("teams").insert({
        name,
        slug,
        color,
        project_id: pId,
        created_by: session.user.id,
      }).select().single();

      if (error) throw error;

      // Auto-add creator as member
      await supabase.from("team_members").insert({
        team_id: data.id,
        user_id: session.user.id,
        role: "admin",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Team created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating team", description: err.message, variant: "destructive" });
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Team deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error deleting team", description: err.message, variant: "destructive" });
    },
  });

  return { teams, isLoading, createTeam, deleteTeam };
};
