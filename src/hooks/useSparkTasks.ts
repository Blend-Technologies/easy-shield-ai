import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SparkTask = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  phase: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export function useSparkTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<SparkTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("spark_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const addTask = async (task: { title: string; phase: string; description?: string; due_date?: string; priority?: string }) => {
    if (!projectId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("spark_tasks")
      .insert({
        project_id: projectId,
        user_id: user.id,
        title: task.title,
        phase: task.phase,
        description: task.description || null,
        due_date: task.due_date || null,
        priority: task.priority || "normal",
      })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return null;
    }
    setTasks((prev) => [data, ...prev]);
    toast({ title: "Task added" });
    return data as SparkTask;
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const { error } = await supabase
      .from("spark_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("spark_tasks").delete().eq("id", taskId);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  return { tasks, loading, addTask, updateTaskStatus, deleteTask, refetch: fetchTasks };
}
