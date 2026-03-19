import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  hook: string;
  body: string;
  created_by: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_bio: string | null;
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for all authors
    const authorIds = [...new Set(data.map((a) => a.created_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio")
      .in("id", authorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const mapped: Announcement[] = data.map((a) => {
      const profile = profileMap.get(a.created_by);
      return {
        id: a.id,
        title: a.title,
        hook: a.hook,
        body: a.body,
        created_by: a.created_by,
        created_at: a.created_at,
        author_name: profile?.full_name || "Admin",
        author_avatar: profile?.avatar_url || null,
        author_bio: profile?.bio || null,
      };
    });

    setAnnouncements(mapped);
    setLoading(false);
  };

  const createAnnouncement = async (title: string, hook: string, body: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("announcements").insert({
      title,
      hook,
      body,
      created_by: user.id,
    });

    if (!error) {
      await fetchAnnouncements();
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return { announcements, loading, createAnnouncement, refetch: fetchAnnouncements };
};
