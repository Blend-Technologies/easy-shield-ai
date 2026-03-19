import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CommunityTopNav from "@/components/community/CommunityTopNav";
import CommunityLeftSidebar from "@/components/community/CommunityLeftSidebar";
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
  const [activeTab, setActiveTab] = useState("Community");
  const [activeSidebarItem, setActiveSidebarItem] = useState("Introductions");
  const [showBanner, setShowBanner] = useState(true);

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
      localStorage.setItem("lastCommunityId", data.id);
      setLoading(false);
    };

    fetchCommunity();
  }, [communityId, navigate]);

  if (loading || !community) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const topOffset = showBanner ? "pt-[96px]" : "pt-14";

  // Full-width tabs
  if (activeTab === "Programs" || activeTab === "Calendar" || activeTab === "Members") {
    return (
      <div className="min-h-screen bg-white">
        <CommunityTopNav
          communityName={community.title}
          logo={community.logo_url}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className={topOffset}>
          {activeTab === "Programs" && <CoursesPage />}
          {activeTab === "Calendar" && <CalendarPage />}
          {activeTab === "Members" && <MembersPage />}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSidebarItem) {
      case "Updates":
      case "Announcements":
        return <UpdatesFeed />;
      case "Events":
        return <EventsPage />;
      default:
        return <CommunityFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityTopNav
        communityName={community.title}
        logo={community.logo_url}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={`flex ${topOffset}`}>
        <CommunityLeftSidebar
          activeItem={activeSidebarItem}
          onItemClick={setActiveSidebarItem}
          showBanner={showBanner}
        />

        <main className="ml-[260px] flex-1 min-w-0 py-6 px-6 max-w-4xl">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CommunityHub;
