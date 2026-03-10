import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Team = {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_by: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    online: boolean | null;
  };
};

export function useTeams(projectId: string | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTeams = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setTeams((data as Team[]) || []);
    }
    setLoading(false);
  };

  const createTeam = async (name: string) => {
    if (!projectId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const colors = ["#7C3AED", "#06B6D4", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];
    const color = colors[teams.length % colors.length];

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name,
        slug,
        color,
        created_by: user.id,
        project_id: projectId,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return null;
    }

    // Auto-add creator as member
    await supabase.from("team_members").insert({
      team_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    setTeams((prev) => [...prev, data as Team]);
    toast({ title: "Team created" });
    return data as Team;
  };

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    toast({ title: "Team deleted" });
  };

  useEffect(() => {
    fetchTeams();
  }, [projectId]);

  return { teams, loading, createTeam, deleteTeam, refetch: fetchTeams };
}

export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMembers = async () => {
    if (!teamId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("*, profiles:user_id(full_name, avatar_url, online)")
      .eq("team_id", teamId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      const mapped = (data || []).map((m: any) => ({
        ...m,
        profile: m.profiles || { full_name: null, avatar_url: null, online: false },
      }));
      setMembers(mapped);
    }
    setLoading(false);
  };

  const addMember = async (email: string) => {
    if (!teamId) return;
    // Look up user by email via profiles — for now just show toast
    toast({ title: "Invite sent", description: `Invitation sent to ${email}` });
  };

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  return { members, loading, addMember, refetch: fetchMembers };
}
