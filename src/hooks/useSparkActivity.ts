import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SparkActivityItem = {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  description: string;
  created_at: string;
};

export function useSparkActivity(projectId: string | null) {
  const [activity, setActivity] = useState<SparkActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from("spark_activity")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10);

    setActivity(data || []);
    setLoading(false);
  };

  const logActivity = async (action: string, description: string) => {
    if (!projectId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("spark_activity")
      .insert({ project_id: projectId, user_id: user.id, action, description })
      .select()
      .single();

    if (data) setActivity((prev) => [data, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    fetchActivity();
  }, [projectId]);

  return { activity, loading, logActivity, refetch: fetchActivity };
}
