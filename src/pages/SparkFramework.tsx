import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectSelector from "@/components/spark/ProjectSelector";
import SparkTopNav from "@/components/spark/SparkTopNav";
import SparkSidebar from "@/components/spark/SparkSidebar";
import SparkDashboardContent from "@/components/spark/SparkDashboardContent";
import { useSparkProjects, SparkProject } from "@/hooks/useSparkProjects";
import { supabase } from "@/integrations/supabase/client";

const SparkFramework = () => {
  const { projects, loading, createProject, deleteProject } = useSparkProjects();
  const [selectedProject, setSelectedProject] = useState<SparkProject | null>(null);
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

  // Sync URL param to selected project
  useEffect(() => {
    if (!projects.length || loading) return;
    if (projectName) {
      const match = projects.find((p) => p.name === decodeURIComponent(projectName));
      if (match && match.id !== selectedProject?.id) {
        setSelectedProject(match);
      }
    } else {
      setSelectedProject(null);
    }
  }, [projectName, projects, loading]);

  const handleSelectProject = (project: SparkProject) => {
    setSelectedProject(project);
    navigate(`/dashboard/spark/${encodeURIComponent(project.name)}`);
  };

  const handleBack = () => {
    setSelectedProject(null);
    navigate("/dashboard/spark");
  };

  if (!authChecked) return null;

  // Project selector view (no project selected)
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <ProjectSelector
          projects={projects}
          loading={loading}
          onSelect={handleSelectProject}
          onCreate={createProject}
          onDelete={deleteProject}
        />
      </div>
    );
  }

  // Full ClickUp-style dashboard
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top nav */}
      <SparkTopNav userName={userName} />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <SparkSidebar
          projects={projects}
          selectedProjectId={selectedProject.id}
          onSelectProject={handleSelectProject}
          onBack={handleBack}
        />
        <SparkDashboardContent project={selectedProject} />
      </div>
    </div>
  );
};

export default SparkFramework;
