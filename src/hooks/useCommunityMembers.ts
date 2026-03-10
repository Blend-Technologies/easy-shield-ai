import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MemberProfile {
  id: string;
  full_name: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  online: boolean | null;
  created_at: string;
  roles: string[];
}

export function useCommunityMembers() {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["community-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, company, title, location, bio, avatar_url, online, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
  });

  const updateMember = useMutation({
    mutationFn: async (member: Partial<MemberProfile> & { id: string }) => {
      const { id, ...updates } = member;
      const { error } = await supabase.from("profiles").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: "Member updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error updating member", description: e.message, variant: "destructive" });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      toast({ title: "Member removed" });
    },
    onError: (e: Error) => {
      toast({ title: "Error removing member", description: e.message, variant: "destructive" });
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    updateMember,
    deleteMember,
  };
}
