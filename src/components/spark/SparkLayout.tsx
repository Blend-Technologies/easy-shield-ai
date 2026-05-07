import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SparkTopNav from "@/components/spark/SparkTopNav";
import SparkSidebar from "@/components/spark/SparkSidebar";
import { useSparkProjects, SparkProject } from "@/hooks/useSparkProjects";
import { Team } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";

const SparkLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get("project") || "";
  const { projects } = useSparkProjects();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
        setUserName(name);
      }
    });
  }, []);

  const selectedProject: SparkProject | null =
    projects.find((p) => p.name === projectName) ?? projects[0] ?? null;

  const handleSelectProject = (p: SparkProject) => {
    navigate(`/dashboard/${encodeURIComponent(p.name)}`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <SparkTopNav userName={userName} />
      <div className="flex flex-1 overflow-hidden">
        <SparkSidebar
          projects={projects}
          selectedProjectId={selectedProject?.id ?? null}
          onSelectProject={handleSelectProject}
          onBack={() => navigate("/dashboard/spark")}
          onSelectTeam={setSelectedTeam}
          selectedTeamId={selectedTeam?.id ?? null}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SparkLayout;
