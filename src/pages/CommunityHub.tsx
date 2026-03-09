import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CommunityTopNav from "@/components/community/CommunityTopNav";
import CommunityLeftSidebar from "@/components/community/CommunityLeftSidebar";
import CommunityRightSidebar from "@/components/community/CommunityRightSidebar";
import CommunityFeed from "@/components/community/CommunityFeed";
import UpdatesFeed from "@/components/community/UpdatesFeed";
import CoursesPage from "@/components/community/CoursesPage";
import EventsPage from "@/components/community/EventsPage";
import CalendarPage from "@/components/community/CalendarPage";

interface CommunityState {
  name: string;
  tagline: string;
  description: string;
  category: string;
  website: string;
  logo: string | null;
}

const CommunityHub = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const community: CommunityState = location.state?.community ?? {
    name: "Data Freelancers",
    tagline: "Where data professionals build their business",
    description: "",
    category: "Technology",
    website: "",
    logo: null,
  };

  const [activeTab, setActiveTab] = useState("Home");
  const [activeSidebarItem, setActiveSidebarItem] = useState("Community");

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

  // Courses tab uses full-width layout without sidebars
  if (activeTab === "Courses") {
    return (
      <div className="min-h-screen bg-background">
        <CommunityTopNav
          communityName={community.name}
          logo={community.logo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <CoursesPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <CommunityTopNav
        communityName={community.name}
        logo={community.logo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex pt-14">
        {/* Left sidebar */}
        <CommunityLeftSidebar
          activeItem={activeSidebarItem}
          onItemClick={setActiveSidebarItem}
        />

        {/* Main content */}
        <main className={`ml-[260px] ${activeSidebarItem === "Events" ? "" : "mr-[260px]"} flex-1 min-w-0 py-8 px-6`}>
          {renderContent()}
        </main>

        {/* Right sidebar — hidden on Events page */}
        {activeSidebarItem !== "Events" && <CommunityRightSidebar />}
      </div>
    </div>
  );
};

export default CommunityHub;
