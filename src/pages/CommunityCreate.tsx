import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowRight, Users, Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CommunityList from "@/components/community/CommunityList";
import CommunityCreateForm from "@/components/community/CommunityCreateForm";

const CommunityCreate = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "create">("list");
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("courses")
        .select("id, title, subtitle, description, category, logo_url, created_at")
        .order("created_at", { ascending: false });
      setCommunities(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (view === "create") {
    return <CommunityCreateForm onBack={() => setView("list")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border flex items-center px-6 gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Users className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">Communities</span>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Communities</h1>
            <p className="text-muted-foreground text-sm mt-1">Browse existing communities or create a new one.</p>
          </div>
          <Button onClick={() => setView("create")}>
            <Plus className="w-4 h-4 mr-2" /> New Community
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No communities yet</p>
            <p className="text-muted-foreground text-sm mb-4">Create your first community to get started.</p>
            <Button onClick={() => setView("create")}>
              <Plus className="w-4 h-4 mr-2" /> Create Community
            </Button>
          </div>
        ) : (
          <CommunityList communities={communities} />
        )}
      </div>
    </div>
  );
};

export default CommunityCreate;
