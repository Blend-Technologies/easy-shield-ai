import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
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

const CommunityHub = () => {
  const location = useLocation();
  const { communityId } = useParams<{ communityId: string }>();
  const community: CommunityState = location.state?.community ?? {
    name: "EZ Shield AI",
    tagline: "Where builders grow together",
    description: "",
    category: "Technology",
    website: "",
    logo: null,
  };

  const [activeTab, setActiveTab] = useState<string>(location.state?.initialTab ?? "Community");
  const [activeChannel, setActiveChannel] = useState("All Posts");

  if (activeTab === "Programs") {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommunityTopNav
          communityName={community.name}
          logo={community.logo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="pt-14">
          <CoursesPage communityId={communityId} />
        </div>
      </div>
    );
  }

  if (activeTab === "Members") {
    return (
      <div className="min-h-screen bg-background">
        <CommunityTopNav
          communityName={community.name}
          logo={community.logo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="pt-14">
          <MembersPage communityId={communityId} />
        </div>
      </div>
    );
  }

  if (activeTab === "Calendar") {
    return (
      <div className="min-h-screen bg-background">
        <CommunityTopNav
          communityName={community.name}
          logo={community.logo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="pt-14">
          <CalendarPage />
        </div>
      </div>
    );
  }

  if (activeTab === "Map" || activeTab === "Pods" || activeTab === "Support Center") {
    return (
      <div className="min-h-screen bg-background">
        <CommunityTopNav
          communityName={community.name}
          logo={community.logo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="pt-14 flex items-center justify-center text-gray-400 h-[80vh]">
          {activeTab} coming soon
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityTopNav
        communityName={community.name}
        logo={community.logo ?? null}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex pt-14">
        <CommunityLeftSidebar
          activeChannel={activeChannel}
          onChannelClick={setActiveChannel}
        />

        {/* Main content */}
        <main className="ml-[240px] flex-1 min-w-0 py-6 px-6 max-w-3xl">
          <CommunityFeed activeChannel={activeChannel} />
        </main>
      </div>
    </div>
  );
};

export default CommunityHub;
