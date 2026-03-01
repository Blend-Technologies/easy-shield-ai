import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SparkProject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export function useSparkProjects() {
  const [projects, setProjects] = useState<SparkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("spark_projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const createProject = async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return null;
    }

    const { data, error } = await supabase
      .from("spark_projects")
      .insert({ name, description: description || null, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return null;
    }

    toast({ title: "Project created", description: `"${name}" has been created.` });
    setProjects((prev) => [data, ...prev]);
    return data as SparkProject;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("spark_projects").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return false;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Project deleted" });
    return true;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, createProject, deleteProject, refetch: fetchProjects };
}
