import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TrendingPost {
  id: string;
  title: string | null;
  body: string;
  likes: number;
  user_id: string;
  author_name: string;
  author_avatar: string;
}

const CommunityRightSidebar = () => {
  const [trending, setTrending] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = async () => {
    const { data: posts } = await supabase
      .from("community_posts")
      .select("id, title, body, likes, user_id")
      .order("likes", { ascending: false })
      .limit(5);

    if (!posts || posts.length === 0) {
      setTrending([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap: Record<string, string> = {};
    (profiles ?? []).forEach((p) => {
      profileMap[p.id] = p.full_name ?? "Anonymous";
    });

    const colors = ["6366f1", "f59e0b", "10b981", "ef4444", "3b82f6", "8b5cf6"];

    setTrending(
      posts.map((post) => {
        const name = profileMap[post.user_id] ?? "Anonymous";
        const color = colors[name.charCodeAt(0) % colors.length];
        return {
          ...post,
          author_name: name,
          author_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=40`,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchTrending();

    const channel = supabase
      .channel("trending_posts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => {
        fetchTrending();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <aside className="fixed top-14 right-0 bottom-0 w-[260px] bg-white border-l border-gray-200 overflow-y-auto z-30 py-5 px-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Trending posts</h3>
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
      {!loading && trending.length === 0 && (
        <p className="text-xs text-gray-400">No trending posts yet.</p>
      )}
      <div className="space-y-4">
        {trending.map((post) => (
          <button
            key={post.id}
            className="w-full flex items-start gap-3 text-left group"
          >
            <img
              src={post.author_avatar}
              alt={post.author_name}
              className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {post.title || post.body.slice(0, 80)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {post.author_name} · {post.likes} {post.likes === 1 ? "like" : "likes"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default CommunityRightSidebar;
