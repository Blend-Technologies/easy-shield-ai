import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type WorkItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  assignee_initials: string | null;
  due_date: string | null;
  priority: string;
  sprint_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useWorkItems() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addItem = async (item: {
    title: string;
    status?: string;
    description?: string;
    assignee_initials?: string;
    due_date?: string;
    priority?: string;
    sprint_id?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in" });
      return null;
    }

    const { data, error } = await supabase
      .from("work_items")
      .insert({
        user_id: user.id,
        title: item.title,
        status: item.status || "backlog",
        description: item.description || null,
        assignee_initials: item.assignee_initials || "KN",
        due_date: item.due_date || null,
        priority: item.priority || "none",
        sprint_id: item.sprint_id || null,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return null;
    }
    setItems((prev) => [data, ...prev]);
    toast({ title: "Work item added" });
    return data as WorkItem;
  };

  const updateItem = async (id: string, updates: Partial<Pick<WorkItem, "title" | "status" | "description" | "assignee_initials" | "due_date" | "priority" | "sprint_id">>) => {
    const { error } = await supabase
      .from("work_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("work_items").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Work item deleted" });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const grouped: Record<string, WorkItem[]> = {
    backlog: items.filter((i) => i.status === "backlog"),
    "in-progress": items.filter((i) => i.status === "in-progress"),
    testing: items.filter((i) => i.status === "testing"),
    "at-risk": items.filter((i) => i.status === "at-risk"),
    blocked: items.filter((i) => i.status === "blocked"),
    "update-required": items.filter((i) => i.status === "update-required"),
    "on-hold": items.filter((i) => i.status === "on-hold"),
    complete: items.filter((i) => i.status === "complete"),
    closed: items.filter((i) => i.status === "closed"),
    // Legacy mappings
    shipped: items.filter((i) => i.status === "shipped"),
  };

  return { items, grouped, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
}
