import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  channel: string;
  image_url: string | null;
  likes: number;
  pinned: boolean;
  created_at: string;
  author_name: string;
  author_avatar: string;
  isLiked: boolean;
  isBookmarked: boolean;
  isOwner: boolean;
}

export function useCommunityPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? null;

    const { data: postsData, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!postsData) { setLoading(false); return; }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const [profilesRes, likesRes, bookmarksRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", userIds),
      uid ? supabase.from("post_likes").select("post_id").eq("user_id", uid) : Promise.resolve({ data: [] }),
      uid ? supabase.from("post_bookmarks").select("post_id").eq("user_id", uid) : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data ?? []).forEach((p) => {
      profileMap[p.id] = p.full_name ?? "Anonymous";
    });

    const likedSet = new Set((likesRes.data ?? []).map((l: { post_id: string }) => l.post_id));
    const bookmarkedSet = new Set((bookmarksRes.data ?? []).map((b: { post_id: string }) => b.post_id));

    const enriched: CommunityPost[] = postsData.map((post) => {
      const name = profileMap[post.user_id] ?? "Anonymous";
      const colors = ["6366f1", "f59e0b", "10b981", "ef4444", "3b82f6", "8b5cf6"];
      const color = colors[name.charCodeAt(0) % colors.length];
      return {
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        body: post.body,
        channel: post.channel,
        image_url: post.image_url,
        likes: post.likes,
        pinned: (post as { pinned?: boolean }).pinned ?? false,
        created_at: post.created_at,
        author_name: name,
        author_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=40`,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        isOwner: uid === post.user_id,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("community_posts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = useCallback(async (title: string, body: string, channel: string, imageUrl?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Not logged in", variant: "destructive" }); return false; }

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      title: title || null,
      body,
      channel: channel || "General Discussion",
      image_url: imageUrl ?? null,
    });

    if (error) {
      toast({ title: "Failed to post", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Post published!" });
    return true;
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast({ title: "Post deleted" });
  }, []);

  const updatePost = useCallback(async (postId: string, title: string, body: string) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ title: title || null, body })
      .eq("id", postId);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, title: title || null, body } : p)
    );
    toast({ title: "Post updated" });
  }, []);

  const togglePin = useCallback(async (postId: string, pinned: boolean) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ pinned } as never)
      .eq("id", postId);
    if (error) {
      toast({ title: "Failed to pin/unpin", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, pinned } : p)
    );
    toast({ title: pinned ? "Post pinned" : "Post unpinned" });
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please log in to like posts", variant: "destructive" }); return; }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    if (post.isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.from("community_posts").update({ likes: post.likes - 1 }).eq("id", postId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("community_posts").update({ likes: post.likes + 1 }).eq("id", postId);
    }
  }, [posts]);

  const toggleBookmark = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please log in to bookmark posts", variant: "destructive" }); return; }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p)
    );

    if (post.isBookmarked) {
      await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: user.id });
    }
  }, [posts]);

  return { posts, loading, createPost, deletePost, updatePost, togglePin, toggleLike, toggleBookmark, refetch: fetchPosts };
}
