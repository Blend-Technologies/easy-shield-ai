import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectIdFromName = (projectName?: string) => {
  const { data: projectId = null } = useQuery({
    queryKey: ["project-id-from-name", projectName],
    queryFn: async () => {
      const decoded = decodeURIComponent(projectName!);
      const { data } = await supabase
        .from("spark_projects")
        .select("id")
        .eq("name", decoded)
        .single();
      return data?.id || null;
    },
    enabled: !!projectName,
  });
  return projectId;
};
