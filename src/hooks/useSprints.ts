import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Sprint = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSprints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sprints")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setSprints((data as Sprint[]) || []);
    }
    setLoading(false);
  };

  const addSprint = async (sprint: { name: string; start_date: string; end_date: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in" });
      return null;
    }

    const { data, error } = await supabase
      .from("sprints")
      .insert({ user_id: user.id, ...sprint })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return null;
    }
    setSprints((prev) => [data as Sprint, ...prev]);
    toast({ title: "Sprint created" });
    return data as Sprint;
  };

  const deleteSprint = async (id: string) => {
    const { error } = await supabase.from("sprints").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setSprints((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Sprint deleted" });
  };

  useEffect(() => {
    fetchSprints();
  }, []);

  return { sprints, loading, addSprint, deleteSprint, refetch: fetchSprints };
}
