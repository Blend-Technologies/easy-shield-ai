import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    title: string | null;
  };
};

export const useTeamMembers = (teamId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*, profiles:user_id(full_name, avatar_url, title)")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        profile: m.profiles || null,
      })) as TeamMember[];
    },
    enabled: !!teamId,
  });

  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("team_members").insert({
        team_id: teamId!,
        user_id: userId,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast({ title: "Member added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error adding member", description: err.message, variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast({ title: "Member removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error removing member", description: err.message, variant: "destructive" });
    },
  });

  return { members, isLoading, addMember, removeMember };
};
