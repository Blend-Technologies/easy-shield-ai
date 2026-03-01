import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProjectSelector from "@/components/spark/ProjectSelector";
import ProjectHome from "@/components/spark/ProjectHome";
import { useSparkProjects, SparkProject } from "@/hooks/useSparkProjects";
import { supabase } from "@/integrations/supabase/client";

const SparkFramework = () => {
  const { projects, loading, createProject, deleteProject } = useSparkProjects();
  const [selectedProject, setSelectedProject] = useState<SparkProject | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [navigate]);

  if (!authChecked) return null;

  return (
    <DashboardLayout>
      {selectedProject ? (
        <ProjectHome
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      ) : (
        <ProjectSelector
          projects={projects}
          loading={loading}
          onSelect={setSelectedProject}
          onCreate={createProject}
          onDelete={deleteProject}
        />
      )}
    </DashboardLayout>
  );
};

export default SparkFramework;
