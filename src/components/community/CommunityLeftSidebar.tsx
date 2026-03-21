import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      { label: "Announcements", emoji: "📣" },
      { label: "All Posts", emoji: "📋" },
      { label: "Introductions", emoji: "👋" },
      { label: "Wins & Milestones", emoji: "🏆" },
      { label: "Share Progress", emoji: "✏️" },
      { label: "Promotion", emoji: "🔥" },
    ],
  },
  {
    title: "HELP & LEARNING",
    items: [
      { label: "Q&A", emoji: "❓" },
      { label: "Technical Support", emoji: "🔧" },
      { label: "Feedback Requests", emoji: "💡" },
      { label: "Resources & Tools", emoji: "🎨" },
    ],
  },
  {
    title: "DISCUSSION",
    items: [
      { label: "General Discussion", emoji: "💬" },
      { label: "Ideas & Brainstorming", emoji: "🧠" },
      { label: "Showcase", emoji: "⭐" },
    ],
  },
];

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number;
}

interface CommunityLeftSidebarProps {
  activeChannel: string;
  onChannelClick: (channel: string) => void;
}

const formatXP = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return String(n);
};

const RANK_ICONS = ["🥇", "🥈", "🥉"];

const CommunityLeftSidebar = ({ activeChannel, onChannelClick }: CommunityLeftSidebarProps) => {
  const [leaderboardTab, setLeaderboardTab] = useState<"XP" | "Streaks">("XP");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: posts } = await supabase
        .from("community_posts")
        .select("user_id, likes");

      if (!posts) return;

      const xpMap: Record<string, number> = {};
      posts.forEach((p) => {
        xpMap[p.user_id] = (xpMap[p.user_id] ?? 0) + (p.likes ?? 0) + 1;
      });

      const topUserIds = Object.entries(xpMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      if (topUserIds.length === 0) return;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", topUserIds);

      const profileMap: Record<string, string> = {};
      (profiles ?? []).forEach((p) => { profileMap[p.id] = p.full_name ?? "Anonymous"; });

      const colors = ["6366f1", "f59e0b", "10b981", "ef4444", "3b82f6", "8b5cf6"];
      const entries: LeaderboardEntry[] = topUserIds.map((uid) => {
        const name = profileMap[uid] ?? "Anonymous";
        const color = colors[name.charCodeAt(0) % colors.length];
        return {
          id: uid,
          name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=32`,
          xp: xpMap[uid],
        };
      });

      setLeaderboard(entries);
    };

    fetchLeaderboard();
  }, []);

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-[240px] bg-white border-r border-gray-200 overflow-y-auto z-30 py-3 flex flex-col">
      {/* Channel groups */}
      <div className="flex-1">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-1">
              {group.title}
            </p>
            {group.items.map((item) => {
              const isActive = activeChannel === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => onChannelClick(item.label)}
                  className={`w-full flex items-center gap-2.5 px-4 py-[7px] text-sm transition-colors ${
                    isActive
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-base leading-none w-5 text-center flex-shrink-0">
                    {item.emoji}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="border-t border-gray-200 pt-3 px-3 pb-4">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-gray-800">Leaderboard</span>
        </div>
        {/* XP / Streaks tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-3 text-xs font-semibold">
          {(["XP", "Streaks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setLeaderboardTab(tab)}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
                leaderboardTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "XP" ? "⚡" : "🔥"} {tab}
            </button>
          ))}
        </div>
        {/* Entries */}
        <div className="space-y-2">
          {leaderboard.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No activity yet</p>
          )}
          {leaderboard.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-2">
              <span className="text-base w-5 text-center flex-shrink-0">
                {RANK_ICONS[i] ?? `${i + 1}.`}
              </span>
              <img src={entry.avatar} alt={entry.name} className="w-7 h-7 rounded-full flex-shrink-0" />
              <span className="text-xs font-medium text-gray-800 truncate flex-1">{entry.name}</span>
              <span className="text-xs font-bold text-violet-600 flex-shrink-0 flex items-center gap-0.5">
                ⚡ {formatXP(entry.xp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default CommunityLeftSidebar;
