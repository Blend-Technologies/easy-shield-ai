import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProjectSelector from "@/components/spark/ProjectSelector";
import ProjectHome from "@/components/spark/ProjectHome";
import { useSparkProjects, SparkProject } from "@/hooks/useSparkProjects";

const SparkFramework = () => {
  const { projects, loading, createProject, deleteProject } = useSparkProjects();
  const [selectedProject, setSelectedProject] = useState<SparkProject | null>(null);

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
