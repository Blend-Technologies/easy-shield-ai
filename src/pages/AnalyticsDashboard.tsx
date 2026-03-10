import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SparkTopNav from "@/components/spark/SparkTopNav";
import SparkSidebar from "@/components/spark/SparkSidebar";
import DashboardContent from "@/components/analytics/DashboardContent";
import { useSparkProjects, SparkProject } from "@/hooks/useSparkProjects";
import { useProjectMembers } from "@/hooks/useProjectMembers";

const AnalyticsDashboard = () => {
  const { projects, loading } = useSparkProjects();
  const [selectedProject, setSelectedProject] = useState<SparkProject | null>(null);
  const { members: projectMembers } = useProjectMembers(selectedProject?.id);
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { projectName } = useParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User");
      setAuthChecked(true);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!projects.length || loading) return;
    if (projectName) {
      const match = projects.find((p) => p.name === decodeURIComponent(projectName));
      if (match) setSelectedProject(match);
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <SparkTopNav userName={userName} />
      <div className="flex flex-1 overflow-hidden">
        <SparkSidebar
          projects={projects}
          selectedProjectId={selectedProject?.id || null}
          onSelectProject={handleSelectProject}
          onBack={handleBack}
        />
        <DashboardContent />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
