import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks the current user's online/offline presence by updating the
 * `online` column in the `profiles` table.
 *
 * Sets online=true on mount / tab-focus, online=false on tab-blur / unload.
 */
export function useOnlinePresence() {
  useEffect(() => {
    let userId: string | null = null;

    const setOnline = async (online: boolean) => {
      if (!userId) return;
      await supabase
        .from("profiles")
        .update({ online })
        .eq("id", userId);
    };

    const handleVisibilityChange = () => {
      setOnline(!document.hidden);
    };

    const handleBeforeUnload = () => {
      if (!userId) return;
      // Use sendBeacon for reliable offline signal on tab close
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
      const headers = {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${localStorage.getItem("sb-" + import.meta.env.VITE_SUPABASE_PROJECT_ID + "-auth-token")
          ? JSON.parse(localStorage.getItem("sb-" + import.meta.env.VITE_SUPABASE_PROJECT_ID + "-auth-token")!).access_token
          : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      };
      const body = JSON.stringify({ online: false });
      navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
      // sendBeacon doesn't support custom headers, so we fall back to fetch keepalive
      fetch(url, {
        method: "PATCH",
        headers,
        body,
        keepalive: true,
      }).catch(() => {});
    };

    // Initialise
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        userId = data.user.id;
        setOnline(true);
      }
    });

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // Set previous user offline if switching
          if (userId && userId !== session.user.id) {
            setOnline(false);
          }
          userId = session.user.id;
          setOnline(true);
        } else {
          setOnline(false);
          userId = null;
        }
      }
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      setOnline(false);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      subscription.unsubscribe();
    };
  }, []);
}

