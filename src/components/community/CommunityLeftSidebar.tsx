import { useState } from "react";
import { Trophy, Medal, Flame } from "lucide-react";

interface SidebarItem {
  label: string;
  emoji: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const GROUPS: SidebarGroup[] = [
  {
    title: "GENERAL",
    items: [
      { label: "Announcements", emoji: "📢" },
      { label: "All Posts", emoji: "📋" },
      { label: "Introductions", emoji: "👋" },
      { label: "Wins & Milestones", emoji: "🏆" },
      { label: "Share Progress", emoji: "📝" },
      { label: "Promotion", emoji: "🎉" },
    ],
  },
  {
    title: "HELP & LEARNING",
    items: [
      { label: "Q&A", emoji: "❓" },
      { label: "Technical Support", emoji: "🔧" },
      { label: "Feedback Requests", emoji: "💡" },
      { label: "Resources & Tools", emoji: "📦" },
    ],
  },
  {
    title: "DISCUSSION",
    items: [
      { label: "General Discussion", emoji: "💬" },
      { label: "Ideas & Brainstorming", emoji: "🧠" },
      { label: "Showcase", emoji: "🎯" },
    ],
  },
];

const LEADERBOARD_DATA = [
  { name: "Taliah", xp: "198.9K", avatar: "https://ui-avatars.com/api/?name=Taliah&background=6B4EFF&color=fff&size=32", rank: 1 },
  { name: "Tyneshia Perine", xp: "71.2K", avatar: "https://ui-avatars.com/api/?name=TP&background=f59e0b&color=fff&size=32", rank: 2 },
  { name: "Marcus Cole", xp: "54.8K", avatar: "https://ui-avatars.com/api/?name=MC&background=10b981&color=fff&size=32", rank: 3 },
];

interface CommunityLeftSidebarProps {
  activeItem: string;
  onItemClick: (label: string) => void;
  showBanner?: boolean;
}

const CommunityLeftSidebar = ({ activeItem, onItemClick, showBanner = true }: CommunityLeftSidebarProps) => {
  const [leaderboardTab, setLeaderboardTab] = useState<"xp" | "streaks">("xp");

  return (
    <aside className={`fixed left-0 bottom-0 w-[260px] bg-gray-50 border-r border-gray-200 overflow-y-auto z-30 flex flex-col ${showBanner ? "top-[96px]" : "top-14"}`}>
      <div className="flex-1 py-4">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="px-4 mb-2">
              <span className="text-[11px] font-bold text-[#6B4EFF] uppercase tracking-wider">
                {group.title}
              </span>
            </div>

            {group.items.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => onItemClick(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[#6B4EFF]/10 text-[#6B4EFF] font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{item.emoji}</span>
                  <span className="text-left truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leaderboard Widget */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-[#6B4EFF]" />
          <span className="text-sm font-bold text-gray-900">Leaderboard</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-lg p-0.5 mb-3">
          <button
            onClick={() => setLeaderboardTab("xp")}
            className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
              leaderboardTab === "xp" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Flame className="w-3 h-3" />
            XP
          </button>
          <button
            onClick={() => setLeaderboardTab("streaks")}
            className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
              leaderboardTab === "streaks" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Flame className="w-3 h-3" />
            Streaks
          </button>
        </div>

        {/* Ranked users */}
        <div className="space-y-2">
          {LEADERBOARD_DATA.map((user) => (
            <div key={user.name} className="flex items-center gap-2.5">
              <span className="w-5 text-center">
                {user.rank === 1 ? <Trophy className="w-4 h-4 text-yellow-500 inline" /> :
                 user.rank === 2 ? <Medal className="w-4 h-4 text-gray-400 inline" /> :
                 <Medal className="w-4 h-4 text-amber-600 inline" />}
              </span>
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
              <span className="flex-1 text-sm text-gray-800 truncate">{user.name}</span>
              <span className="bg-[#6B4EFF]/10 text-[#6B4EFF] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {user.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default CommunityLeftSidebar;
