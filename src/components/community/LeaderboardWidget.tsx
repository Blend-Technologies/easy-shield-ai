import { Trophy, Medal, Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const formatXp = (xp: number) => {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return String(xp);
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500 inline" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-400 inline" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600 inline" />;
  return <span className="text-xs font-bold text-muted-foreground">{rank}</span>;
};

const LeaderboardWidget = () => {
  const [tab, setTab] = useState<"xp" | "streaks">("xp");
  const { xpLeaderboard, streakLeaderboard, loading } = useLeaderboard(5);

  const entries = tab === "xp" ? xpLeaderboard : streakLeaderboard;

  return (
    <div className="border-t border-border px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Leaderboard</span>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-lg p-0.5 mb-3">
        <button
          onClick={() => setTab("xp")}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
            tab === "xp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Flame className="w-3 h-3" />
          XP
        </button>
        <button
          onClick={() => setTab("streaks")}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
            tab === "streaks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Flame className="w-3 h-3" />
          Streaks
        </button>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No data yet — start engaging!</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.user_id} className="flex items-center gap-2.5">
              <span className="w-5 text-center">
                <RankIcon rank={entry.rank} />
              </span>
              <img
                src={
                  entry.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.full_name || "U")}&background=6B4EFF&color=fff&size=32`
                }
                alt={entry.full_name || "User"}
                className="w-7 h-7 rounded-full"
              />
              <span className="flex-1 text-sm text-foreground truncate">{entry.full_name}</span>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {tab === "xp"
                  ? formatXp((entry as any).total_xp)
                  : `${(entry as any).current_streak}d`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;
