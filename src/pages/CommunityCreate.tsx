import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Sparkles, Plus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import CommunityList from "@/components/community/CommunityList";
import CommunityCreateForm from "@/components/community/CommunityCreateForm";

const CommunityCreate = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "create">("list");
  const [allCommunities, setAllCommunities] = useState<any[]>([]);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: all } = await supabase
      .from("courses")
      .select("id, title, subtitle, description, category, logo_url, created_at, created_by")
      .order("created_at", { ascending: false });

    setAllCommunities(all || []);

    if (user) {
      setMyCommunities((all || []).filter((c) => c.created_by === user.id));

      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      const enrolledIds = new Set((enrollments || []).map((e) => e.course_id));
      setJoinedCommunities((all || []).filter((c) => enrolledIds.has(c.id)));
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (view === "create") {
    return <CommunityCreateForm onBack={() => { setView("list"); fetchAll(); }} />;
  }

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-20 border border-dashed border-border rounded-2xl">
      <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-foreground font-medium mb-1">{message}</p>
    </div>
  );

  const renderList = (communities: any[], emptyMsg: string, showActions = false) =>
    loading ? (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ) : communities.length === 0 ? (
      <EmptyState message={emptyMsg} />
    ) : (
      <CommunityList communities={communities} onRefresh={fetchAll} showActions={showActions} />
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border flex items-center px-6 gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Users className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">Communities</span>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Communities</h1>
            <p className="text-muted-foreground text-sm mt-1">Browse, join, or create communities.</p>
          </div>
          <Button onClick={() => setView("create")}>
            <Plus className="w-4 h-4 mr-2" /> New Community
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Communities</TabsTrigger>
            <TabsTrigger value="mine">Created by Me</TabsTrigger>
            <TabsTrigger value="joined">Joined</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderList(allCommunities, "No communities yet")}
          </TabsContent>
          <TabsContent value="mine">
            {renderList(myCommunities, "You haven't created any communities yet", true)}
          </TabsContent>
          <TabsContent value="joined">
            {renderList(joinedCommunities, "You haven't joined any communities yet")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityCreate;
