import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CommunityTopNav from "@/components/community/CommunityTopNav";
import CommunityLeftSidebar from "@/components/community/CommunityLeftSidebar";
import CommunityRightSidebar from "@/components/community/CommunityRightSidebar";
import CommunityFeed from "@/components/community/CommunityFeed";

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

  return (
    <div className="min-h-screen bg-gray-50">
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
        <main className="ml-[260px] mr-[260px] flex-1 min-w-0 py-8 px-6">
          <CommunityFeed />
        </main>

        {/* Right sidebar */}
        <CommunityRightSidebar />
      </div>
    </div>
  );
};

export default CommunityHub;
