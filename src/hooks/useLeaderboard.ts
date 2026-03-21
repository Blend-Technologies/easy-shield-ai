import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  full_name: string | null;
  avatar_url: string | null;
  rank: number;
}

interface StreakEntry {
  user_id: string;
  current_streak: number;
  full_name: string | null;
  avatar_url: string | null;
  rank: number;
}

export const useLeaderboard = (limit = 10) => {
  const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboards = async () => {
    setLoading(true);

    // Fetch XP leaderboard
    const { data: xpData } = await supabase
      .from("user_xp")
      .select("user_id, total_xp")
      .order("total_xp", { ascending: false })
      .limit(limit);

    // Fetch streak leaderboard
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak")
      .order("current_streak", { ascending: false })
      .limit(limit);

    // Collect all user IDs
    const userIds = new Set<string>();
    xpData?.forEach((r) => userIds.add(r.user_id));
    streakData?.forEach((r) => userIds.add(r.user_id));

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(userIds));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    setXpLeaderboard(
      (xpData || []).map((r, i) => ({
        user_id: r.user_id,
        total_xp: r.total_xp,
        full_name: profileMap.get(r.user_id)?.full_name || "Unknown",
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
        rank: i + 1,
      }))
    );

    setStreakLeaderboard(
      (streakData || []).map((r, i) => ({
        user_id: r.user_id,
        current_streak: r.current_streak,
        full_name: profileMap.get(r.user_id)?.full_name || "Unknown",
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
        rank: i + 1,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [limit]);

  return { xpLeaderboard, streakLeaderboard, loading, refetch: fetchLeaderboards };
};
