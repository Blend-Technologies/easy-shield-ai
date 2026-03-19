import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CommunityTopNav from "@/components/community/CommunityTopNav";
import CommunityLeftSidebar from "@/components/community/CommunityLeftSidebar";
import CommunityRightSidebar from "@/components/community/CommunityRightSidebar";
import CommunityFeed from "@/components/community/CommunityFeed";
import UpdatesFeed from "@/components/community/UpdatesFeed";
import CoursesPage from "@/components/community/CoursesPage";
import EventsPage from "@/components/community/EventsPage";
import CalendarPage from "@/components/community/CalendarPage";
import MembersPage from "@/components/community/MembersPage";

interface CommunityData {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
}

const CommunityHub = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [activeSidebarItem, setActiveSidebarItem] = useState("Community");

  useEffect(() => {
    if (!communityId) {
      navigate("/community/create");
      return;
    }

    const fetchCommunity = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, subtitle, description, category, logo_url")
        .eq("id", communityId)
        .single();

      if (error || !data) {
        navigate("/community/create");
        return;
      }
      setCommunity(data);
      setLoading(false);
    };

    fetchCommunity();
  }, [communityId, navigate]);

  if (loading || !community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSidebarItem) {
      case "Updates":
        return <UpdatesFeed />;
      case "Events":
        return <EventsPage />;
      default:
        return <CommunityFeed />;
    }
  };

  // Full-width tabs without sidebars
  if (activeTab === "Courses" || activeTab === "Calendar" || activeTab === "Members") {
    return (
      <div className="min-h-screen bg-background">
        <CommunityTopNav
          communityName={community.title}
          logo={community.logo_url}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="pt-14">
          {activeTab === "Courses" && <CoursesPage />}
          {activeTab === "Calendar" && <CalendarPage />}
          {activeTab === "Members" && <MembersPage />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <CommunityTopNav
        communityName={community.title}
        logo={community.logo_url}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex pt-14">
        <CommunityLeftSidebar
          activeItem={activeSidebarItem}
          onItemClick={setActiveSidebarItem}
        />

        <main className={`ml-[260px] ${activeSidebarItem === "Community" ? "mr-[260px]" : ""} flex-1 min-w-0 py-8 px-6`}>
          {renderContent()}
        </main>

        {activeSidebarItem === "Community" && <CommunityRightSidebar />}
      </div>
    </div>
  );
};

export default CommunityHub;
