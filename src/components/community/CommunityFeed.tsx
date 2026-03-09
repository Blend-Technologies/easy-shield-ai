import { useState, useRef, useEffect, useMemo } from "react";
import { Bookmark, MoreHorizontal, Plus, ChevronDown, Check, ThumbsUp, Trash2, Loader2 } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { useCommunityPosts, CommunityPost } from "@/hooks/useCommunityPosts";
import { formatDistanceToNow } from "date-fns";

const SORT_OPTIONS = [
  "For you",
  "Alphabetical",
  "Latest",
  "Likes",
  "New activity",
  "Oldest",
  "Popular",
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
  const preview = post.body.length > 160 ? post.body.slice(0, 160) + "…" : post.body;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={post.author_avatar} alt={post.author_name} className="w-10 h-10 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{post.author_name}</span>
                <span className="text-gray-400 text-xs">{timeAgo}</span>
              </div>
              <span className="text-gray-500 text-xs">Posted in {post.channel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleBookmark(post.id)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                post.isBookmarked ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
              title={post.isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark className="w-4 h-4" fill={post.isBookmarked ? "currentColor" : "none"} />
            </button>
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
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete post
                    </button>
                  )}
                  {!post.isOwner && (
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Report post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {post.title && (
          <h3 className="font-bold text-gray-900 text-base mb-2">{post.title}</h3>
        )}
        <p className="text-gray-600 text-sm leading-relaxed">
          {expanded ? post.body : preview}
          {!expanded && post.body.length > 160 && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-1 text-blue-600 font-medium hover:underline"
            >
              See more
            </button>
          )}
        </p>

        {/* Like button */}
        <div className="mt-3 flex items-center gap-1">
          <button
            onClick={() => onToggleLike(post.id)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              post.isLiked
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" fill={post.isLiked ? "currentColor" : "none"} />
            {post.likes > 0 && <span>{post.likes}</span>}
            <span>{post.isLiked ? "Liked" : "Like"}</span>
          </button>
        </div>
      </div>

      {post.image_url && (
        <div className="border-t border-gray-100">
          <img
            src={post.image_url}
            alt="Post attachment"
            className="w-full h-52 object-cover"
          />
        </div>
      )}
    </div>
  );
};

const CommunityFeed = () => {
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState("Latest");
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { posts, loading, createPost, deletePost, toggleLike, toggleBookmark } = useCommunityPosts();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    if (sortOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortOpen]);

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    switch (sort) {
      case "Alphabetical":
        return arr.sort((a, b) => (a.title ?? a.body).localeCompare(b.title ?? b.body));
      case "Oldest":
        return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "Likes":
      case "Popular":
        return arr.sort((a, b) => b.likes - a.likes);
      case "Latest":
      case "New activity":
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      default:
        return arr;
    }
  }, [posts, sort]);

  const handlePublish = async (title: string, body: string, channel: string) => {
    const ok = await createPost(title, body, channel);
    if (ok) setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} onPublish={handlePublish} />

      {/* Feed header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Feed</h2>
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition-colors select-none"
            >
              {sort}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-150 origin-top-right ${
                sortOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
              style={{ width: "340px" }}
            >
              <div className="py-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => { setSort(option); setSortOpen(false); }}
                    className={`w-full flex items-center justify-between text-left transition-colors hover:bg-gray-50 ${
                      sort === option ? "font-semibold text-gray-900" : "font-normal text-gray-800"
                    }`}
                    style={{ fontSize: "18px", paddingLeft: "24px", paddingRight: "20px", paddingTop: "14px", paddingBottom: "14px" }}
                  >
                    {option}
                    {sort === option && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            New post
          </button>
        </div>
      </div>

      {/* Post composer */}
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 cursor-pointer group"
        onClick={() => setModalOpen(true)}
      >
        <img
          src="https://ui-avatars.com/api/?name=Me&background=2563EB&color=fff&size=40"
          alt="me"
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <span className="flex-1 text-sm text-gray-400 select-none">Start a post…</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedPosts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">No posts yet. Be the first to share something!</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
          >
            Create a post
          </button>
        </div>
      )}

      {/* Post cards */}
      {!loading && sortedPosts.map((post) => (
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
