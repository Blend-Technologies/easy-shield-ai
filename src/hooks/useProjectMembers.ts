import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProjectMember = {
  id: string; // profile id / user_id
  full_name: string;
  initials: string;
  avatar_url: string | null;
  role: string;
  team_name: string;
  team_color: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const useProjectMembers = (projectId?: string | null) => {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      // Get all teams for this project
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, color")
        .eq("project_id", projectId!);

      if (teamsError || !teams?.length) return [];

      const teamIds = teams.map((t) => t.id);
      const teamMap = new Map(teams.map((t) => [t.id, t]));

      // Get all team members with profiles
      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select("user_id, role, team_id, profiles:user_id(full_name, avatar_url)")
        .in("team_id", teamIds);

      if (membersError || !teamMembers) return [];

      // Deduplicate by user_id, keeping first occurrence
      const seen = new Set<string>();
      const result: ProjectMember[] = [];

      for (const tm of teamMembers as any[]) {
        if (seen.has(tm.user_id)) continue;
        seen.add(tm.user_id);

        const team = teamMap.get(tm.team_id);
        const name = tm.profiles?.full_name || "Unknown";

        result.push({
          id: tm.user_id,
          full_name: name,
          initials: getInitials(name),
          avatar_url: tm.profiles?.avatar_url || null,
          role: tm.role,
          team_name: team?.name || "",
          team_color: team?.color || "#7C3AED",
        });
      }

      return result;
    },
    enabled: !!projectId,
  });

  return { members, isLoading };
};
