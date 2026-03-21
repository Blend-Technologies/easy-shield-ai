import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks which users are currently online via Supabase Realtime Presence.
 * Also marks the current user online/offline in the profiles table.
 */
export function usePresence() {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Mark this user online in the DB
      await supabase.from("profiles").update({ online: true }).eq("id", userId);

      channel = supabase.channel("community-presence");

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState<{ user_id: string }>();
          const ids = new Set<string>();
          Object.values(state).forEach((list) =>
            list.forEach((p) => ids.add(p.user_id))
          );
          setOnlineIds(ids);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          setOnlineIds((prev) => {
            const next = new Set(prev);
            newPresences.forEach((p: { user_id: string }) => next.add(p.user_id));
            return next;
          });
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          setOnlineIds((prev) => {
            const next = new Set(prev);
            leftPresences.forEach((p: { user_id: string }) => next.delete(p.user_id));
            return next;
          });
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel!.track({ user_id: userId });
          }
        });
    };

    init();

    const markOffline = () => {
      if (userId) {
        // fire-and-forget on page close
        supabase.from("profiles").update({ online: false }).eq("id", userId);
      }
      if (channel) supabase.removeChannel(channel);
    };

    window.addEventListener("beforeunload", markOffline);

    return () => {
      window.removeEventListener("beforeunload", markOffline);
      markOffline();
    };
  }, []);

  return { onlineIds };
}
