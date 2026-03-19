import { useState, useRef, useEffect, useMemo } from "react";
import { Bookmark, MoreHorizontal, Plus, Search, MessageCircle, Trash2, Loader2, Calendar, Clock } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { useCommunityPosts, CommunityPost } from "@/hooks/useCommunityPosts";
import { formatDistanceToNow, format } from "date-fns";

const FILTER_TABS = ["Recent", "Trending", "Most Discussed"] as const;

const REACTIONS = [
  { emoji: "😮", count: 4 },
  { emoji: "❤️", count: 2 },
  { emoji: "👊", count: 1 },
  { emoji: "🚀", count: 1 },
];

interface PostCardProps {
  post: CommunityPost;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;
}

const PostCard = ({ post, onToggleLike, onToggleBookmark, onDelete }: PostCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const dateStr = format(new Date(post.created_at), "MMM dd");
  const preview = post.body.length > 200 ? post.body.slice(0, 200) + "…" : post.body;

  // Generate initials
  const initials = post.author_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const level = Math.floor(Math.random() * 5) + 1; // Mock level
  const dotColor = Math.random() > 0.5 ? "bg-blue-500" : "bg-orange-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Author row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={post.author_avatar} alt={post.author_name} className="w-11 h-11 rounded-full" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#6B4EFF] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {level}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{post.author_name}</span>
                <span className="text-gray-400 text-xs">{dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  🔥 <span className="text-gray-600 font-medium">{post.channel}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                {post.isOwner && (
                  <button
                    onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete post
                  </button>
                )}
                {!post.isOwner && (
                  <button onClick={() => setMenuOpen(false)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Report post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title with dot */}
        {post.title && (
          <div className="flex items-start gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{post.title}</h3>
          </div>
        )}

        {/* Body */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {expanded ? post.body : preview}
          {!expanded && post.body.length > 200 && (
            <button onClick={() => setExpanded(true)} className="ml-1 text-[#6B4EFF] font-medium hover:underline">
              See more
            </button>
          )}
        </p>

        {/* Reaction row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Emoji reactions */}
            <div className="flex items-center gap-1.5">
              {REACTIONS.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onToggleLike(post.id)}
                  className="flex items-center gap-0.5 text-xs text-gray-600 hover:bg-gray-100 px-1.5 py-1 rounded-md transition-colors"
                >
                  <span>{r.emoji}</span>
                  <span className="text-gray-500">{post.likes > 0 && i === 0 ? post.likes : r.count}</span>
                </button>
              ))}
            </div>

            {/* Comment count */}
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>3</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={() => onToggleBookmark(post.id)}
              className={`${post.isBookmarked ? "text-[#6B4EFF]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={post.isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Right side: avatars + time */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {[0, 1, 2].map(i => (
                <img
                  key={i}
                  src={`https://ui-avatars.com/api/?name=U${i}&background=${["6B4EFF", "10b981", "f59e0b"][i]}&color=fff&size=20`}
                  className="w-5 h-5 rounded-full border border-white"
                  alt=""
                />
              ))}
            </div>
            <span className="text-xs text-[#6B4EFF]">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommunityFeed = () => {
  const [filter, setFilter] = useState<typeof FILTER_TABS[number]>("Recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { posts, loading, createPost, deletePost, toggleLike, toggleBookmark } = useCommunityPosts();

  const sortedPosts = useMemo(() => {
    let arr = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(p =>
        (p.title?.toLowerCase().includes(q)) ||
        p.body.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (filter) {
      case "Trending":
        return arr.sort((a, b) => b.likes - a.likes);
      case "Most Discussed":
        return arr.sort((a, b) => b.likes - a.likes); // Placeholder
      case "Recent":
      default:
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [posts, filter, searchQuery]);

  const handlePublish = async (title: string, body: string, channel: string) => {
    const ok = await createPost(title, body, channel);
    if (ok) setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} onPublish={handlePublish} />

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center px-4 py-3 gap-3">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search posts by title, content, or author..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-[#6B4EFF] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab === "Recent" && <Clock className="w-3.5 h-3.5" />}
            {tab === "Trending" && <span>🔥</span>}
            {tab === "Most Discussed" && <MessageCircle className="w-3.5 h-3.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Post composer */}
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 cursor-pointer group"
        onClick={() => setModalOpen(true)}
      >
        <img
          src="https://ui-avatars.com/api/?name=Me&background=6B4EFF&color=fff&size=40"
          alt="me"
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <span className="flex-1 text-sm text-gray-400 select-none">Share something with the community...</span>
        <button
          onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
          className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Event reminder banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          <span className="font-bold text-gray-900">Asset Protection, Trademark And Trust Fund Masterclass With Chanise Anderson</span>
          {" "}is happening in about 9 hours
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && sortedPosts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">No posts yet. Be the first to share something!</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
          >
            Create a post
          </button>
        </div>
      )}

      {/* Post cards */}
      {!loading && sortedPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onDelete={deletePost}
        />
      ))}
    </div>
  );
};

export default CommunityFeed;
