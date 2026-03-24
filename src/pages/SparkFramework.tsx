import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectSelector from "@/components/spark/ProjectSelector";
import SparkTopNav from "@/components/spark/SparkTopNav";
import SparkSidebar from "@/components/spark/SparkSidebar";
import SparkDashboardContent from "@/components/spark/SparkDashboardContent";
import TeamDetailView from "@/components/spark/TeamDetailView";
import { useSparkProjects, SparkProject } from "@/hooks/useSparkProjects";
import { Team } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";

const SparkFramework = () => {
  const { projects, loading, createProject, deleteProject, renameProject } = useSparkProjects();
  const [selectedProject, setSelectedProject] = useState<SparkProject | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { projectName } = useParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
      setUserName(name);
      setAuthChecked(true);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!projects.length || loading) return;
    if (projectName) {
      const decoded = decodeURIComponent(projectName);
      const match = projects.find((p) => p.name === decoded);
      if (match && match.id !== selectedProject?.id) {
        setSelectedProject(match);
      }
    } else if (!selectedProject) {
      // Only reset if no project is already selected (avoids clearing after create)
      setSelectedProject(null);
    }
  }, [projectName, projects, loading]);

  const handleSelectProject = (project: SparkProject) => {
    setSelectedProject(project);
    setSelectedTeam(null);
    navigate(`/dashboard/${encodeURIComponent(project.name)}`);
  };

  const handleBack = () => {
    setSelectedProject(null);
    setSelectedTeam(null);
    navigate("/dashboard/spark");
  };

  if (!authChecked) return null;

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <ProjectSelector
          projects={projects}
          loading={loading}
          onSelect={handleSelectProject}
          onCreate={createProject}
          onDelete={deleteProject}
          onRename={renameProject}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <SparkTopNav userName={userName} />
      <div className="flex flex-1 overflow-hidden">
        <SparkSidebar
          projects={projects}
          selectedProjectId={selectedProject.id}
          onSelectProject={handleSelectProject}
          onBack={handleBack}
          onSelectTeam={(team) => setSelectedTeam(team)}
          selectedTeamId={selectedTeam?.id || null}
        />
        {selectedTeam ? (
          <TeamDetailView team={selectedTeam} onBack={() => setSelectedTeam(null)} />
        ) : (
          <SparkDashboardContent project={selectedProject} />
        )}
      </div>
    </div>
  );
};

export default SparkFramework;
