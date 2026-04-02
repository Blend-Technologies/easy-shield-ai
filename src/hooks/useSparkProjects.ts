import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Priority = "none" | "low" | "medium" | "high" | "critical";

export type SparkProject = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_favorite: boolean;
  priority: Priority;
  state: string | null;
  due_date: string | null;
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
      setProjects((data || []) as unknown as SparkProject[]);
    }
    setLoading(false);
  };

  const createProject = async (name: string, description?: string, state?: string, due_date?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return null;
    }

    const { data, error } = await supabase
      .from("spark_projects")
      .insert({ name, description: description || null, state: state?.trim() || null, due_date: due_date || null, user_id: user.id } as any)
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return null;
    }

    toast({ title: "Project created", description: `"${name}" has been created.` });
    setProjects((prev) => [data as unknown as SparkProject, ...prev]);
    return data as unknown as SparkProject;
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

  const updateProject = async (id: string, name: string, description?: string, state?: string, due_date?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const { data, error } = await supabase
      .from("spark_projects")
      .update({
        name: trimmedName,
        description: description?.trim() || null,
        state: state?.trim() || null,
        due_date: due_date || null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return false;
    }
    setProjects((prev) => prev.map((p) => (p.id === id ? (data as unknown as SparkProject) : p)));
    toast({ title: "Project updated" });
    return true;
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const { data, error } = await supabase
      .from("spark_projects")
      .update({ is_favorite: !current } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return false;
    }
    setProjects((prev) => prev.map((p) => (p.id === id ? (data as unknown as SparkProject) : p)));
    return true;
  };

  const setPriority = async (id: string, priority: Priority) => {
    const { data, error } = await supabase
      .from("spark_projects")
      .update({ priority } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return false;
    }
    setProjects((prev) => prev.map((p) => (p.id === id ? (data as unknown as SparkProject) : p)));
    return true;
  };

  const setDueDate = async (id: string, due_date: string | null) => {
    const { data, error } = await supabase
      .from("spark_projects")
      .update({ due_date } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return false;
    }
    setProjects((prev) => prev.map((p) => (p.id === id ? (data as unknown as SparkProject) : p)));
    return true;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, createProject, deleteProject, updateProject, toggleFavorite, setPriority, setDueDate, refetch: fetchProjects };
}
