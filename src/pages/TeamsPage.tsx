import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSparkProjects } from "@/hooks/useSparkProjects";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TeamsContent from "@/components/teams/TeamsContent";

const TeamsPage = () => {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const { projects } = useSparkProjects();
  const project = projects.find((p) => p.name === decodeURIComponent(projectName || ""));
  const { teams, loading, createTeam, deleteTeam } = useTeams(project?.id || null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  return (
    <DashboardLayout>
      <TeamsContent
        teams={teams}
        selectedTeam={selectedTeam}
        onSelectTeam={(t) => setSelectedTeamId(t.id)}
        onCreateTeam={createTeam}
        onDeleteTeam={deleteTeam}
        loading={loading}
        projectName={projectName || ""}
      />
    </DashboardLayout>
  );
};

export default TeamsPage;
