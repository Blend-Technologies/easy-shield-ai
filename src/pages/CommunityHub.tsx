import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CommunityTopNav from "@/components/community/CommunityTopNav";
import CommunityLeftSidebar from "@/components/community/CommunityLeftSidebar";
import CommunityFeed from "@/components/community/CommunityFeed";
import CalendarPage from "@/components/community/CalendarPage";
import MembersPage from "@/components/community/MembersPage";
import CoursesPage from "@/components/community/CoursesPage";

interface CommunityState {
  name: string;
  tagline?: string;
  description?: string | null;
  category?: string | null;
  website?: string;
  logo?: string | null;
}

// Maps URL slug → display label and vice versa
const SLUG_TO_TAB: Record<string, string> = {
  community: "Community",
  programs: "Programs",
  members: "Members",
  calendar: "Calendar",
  map: "Map",
  pods: "Pods",
  support: "Support Center",
};

const TAB_TO_SLUG: Record<string, string> = {
  Community: "community",
  Programs: "programs",
  Members: "members",
  Calendar: "calendar",
  Map: "map",
  Pods: "pods",
  "Support Center": "support",
};

const CommunityHub = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { communityId, tab: tabSlug } = useParams<{ communityId: string; tab?: string }>();

  const community: CommunityState = (location.state as { community?: CommunityState } | null)?.community ?? {
    name: "EZ Shield AI",
    tagline: "Where builders grow together",
    description: "",
    category: "Technology",
    website: "",
    logo: null,
  };

  const activeTab = SLUG_TO_TAB[tabSlug ?? "community"] ?? "Community";
  const [activeChannel, setActiveChannel] = useState("All Posts");

  const handleTabChange = (tab: string) => {
    const slug = TAB_TO_SLUG[tab] ?? "community";
    // "community" tab uses the base URL (no slug) for a clean default URL
    navigate(
      slug === "community"
        ? `/community/hub/${communityId}`
        : `/community/hub/${communityId}/${slug}`,
      { replace: false }
    );
  };

  const nav = (
    <CommunityTopNav
      communityName={community.name}
      logo={community.logo ?? null}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );

  if (activeTab === "Programs") {
    return (
      <div className="min-h-screen bg-gray-50">
        {nav}
        <div className="pt-14">
          <CoursesPage communityId={communityId} />
        </div>
      </div>
    );
  }

  if (activeTab === "Members") {
    return (
      <div className="min-h-screen bg-background">
        {nav}
        <div className="pt-14">
          <MembersPage communityId={communityId} />
        </div>
      </div>
    );
  }

  if (activeTab === "Calendar") {
    return (
      <div className="min-h-screen bg-background">
        {nav}
        <div className="pt-14">
          <CalendarPage />
        </div>
      </div>
    );
  }

  if (activeTab === "Map" || activeTab === "Pods" || activeTab === "Support Center") {
    return (
      <div className="min-h-screen bg-background">
        {nav}
        <div className="pt-14 flex items-center justify-center text-gray-400 h-[80vh]">
          {activeTab} coming soon
        </div>
      </div>
    );
  }

  // Default: Community feed
  return (
    <div className="min-h-screen bg-gray-50">
      {nav}
      <div className="flex pt-14">
        <CommunityLeftSidebar
          activeChannel={activeChannel}
          onChannelClick={setActiveChannel}
        />
        <main className="ml-[240px] flex-1 min-w-0 py-6 px-6 max-w-3xl">
          <CommunityFeed activeChannel={activeChannel} />
        </main>
      </div>
    </div>
  );
};

export default CommunityHub;
