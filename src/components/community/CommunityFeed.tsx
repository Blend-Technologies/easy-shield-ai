import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search, Plus, MoreHorizontal, ThumbsUp, Trash2,
  Loader2, CalendarDays, Pin, Megaphone, Pencil, Check, X,
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { useCommunityPosts, CommunityPost } from "@/hooks/useCommunityPosts";
import { format } from "date-fns";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type FeedTab = "Recent" | "Trending" | "Most Discussed";

// Converts plain-text URLs into clickable <a> links
const linkifyText = (text: string) => {
  const URL_RE = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-600 underline hover:text-violet-800 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

interface PostCardProps {
  post: CommunityPost;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, body: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  isAdmin: boolean;
}

const PostCard = ({ post, onToggleLike, onToggleBookmark, onDelete, onEdit, onTogglePin, isAdmin }: PostCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title ?? "");
  const [editBody, setEditBody] = useState(post.body);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const dateLabel = format(new Date(post.created_at), "MMM d");
  const preview = post.body.length > 200 ? post.body.slice(0, 200) + "…" : post.body;

  const handleSaveEdit = () => {
    onEdit(post.id, editTitle, editBody);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={post.author_avatar} alt={post.author_name} className="w-10 h-10 rounded-full flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{post.author_name}</span>
                <span className="text-gray-400 text-xs">· {dateLabel}</span>
                {post.channel && (
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium flex items-center gap-1">
                    📣 {post.channel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {post.pinned && (
              <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                <Pin className="w-3.5 h-3.5 fill-orange-500" />
                Pinned
              </span>
            )}
            <button
              onClick={() => onToggleBookmark(post.id)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                post.isBookmarked ? "text-violet-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                  {(post.isOwner || isAdmin) && (
                    <button
                      onClick={() => { setEditing(true); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit post
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => { onTogglePin(post.id, !post.pinned); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      {post.pinned ? "Unpin post" : "Pin post"}
                    </button>
                  )}
                  {(post.isOwner || isAdmin) && (
                    <button
                      onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete post
                    </button>
                  )}
                  {!post.isOwner && !isAdmin && (
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Report post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit mode */}
        {editing ? (
          <div className="space-y-2">
            <input
              className="w-full text-base font-semibold text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-300"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title (optional)"
            />
            <textarea
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-300 resize-none"
              rows={4}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.title && (
              <h3 className="font-bold text-gray-900 text-base mb-2 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-[6px]" />
                {post.title}
              </h3>
            )}
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {expanded ? linkifyText(post.body) : linkifyText(preview)}
              {!expanded && post.body.length > 200 && (
                <button onClick={() => setExpanded(true)} className="ml-1 text-violet-600 font-medium hover:underline">
                  See more
                </button>
              )}
            </p>
          </>
        )}

        {!editing && (
          <div className="mt-3 flex items-center gap-1">
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                post.isLiked
                  ? "text-violet-600 bg-violet-50 hover:bg-violet-100"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" fill={post.isLiked ? "currentColor" : "none"} />
              {post.likes > 0 && <span>{post.likes}</span>}
              <span>{post.isLiked ? "Liked" : "Like"}</span>
            </button>
          </div>
        )}
      </div>

      {post.image_url && !editing && (
        <div className="border-t border-gray-100">
          <img src={post.image_url} alt="Post attachment" className="w-full h-auto object-contain max-h-[600px]" />
        </div>
      )}
    </div>
  );
};

// Announcements grouped card (yellow background)
const AnnouncementsCard = ({ posts }: { posts: CommunityPost[] }) => {
  if (posts.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-2 border-b border-amber-200">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 text-base">Announcements</h3>
      </div>
      <div className="divide-y divide-amber-100">
        {posts.map((post) => {
          const dateLabel = format(new Date(post.created_at), "MMM d");
          const preview = post.body.length > 120 ? post.body.slice(0, 120) + "…" : post.body;
          return (
            <div key={post.id} className="px-5 py-3 flex items-start gap-3">
              <img src={post.author_avatar} alt={post.author_name} className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm leading-snug">
                  {post.title || post.body.slice(0, 80)}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed line-clamp-2">{preview}</p>
                <p className="text-orange-500 text-xs mt-1 font-medium">
                  {post.author_name} · {dateLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CommunityFeedProps {
  activeChannel: string;
}

const CommunityFeed = ({ activeChannel }: CommunityFeedProps) => {
  const [feedTab, setFeedTab] = useState<FeedTab>("Recent");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { isAdmin } = useIsAdmin();

  const { posts, loading, createPost, deletePost, toggleLike, toggleBookmark, updatePost, togglePin } =
    useCommunityPosts();

  // Filter by channel
  const channelFiltered = useMemo(() => {
    if (activeChannel === "All Posts" || activeChannel === "Community") return posts;
    return posts.filter((p) => p.channel === activeChannel);
  }, [posts, activeChannel]);

  // Filter by search
  const searchFiltered = useMemo(() => {
    if (!search.trim()) return channelFiltered;
    const q = search.toLowerCase();
    return channelFiltered.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q)
    );
  }, [channelFiltered, search]);

  // Sort by tab
  const sortedPosts = useMemo(() => {
    const arr = [...searchFiltered];
    if (feedTab === "Trending") return arr.sort((a, b) => b.likes - a.likes);
    if (feedTab === "Most Discussed") return arr.sort((a, b) => b.likes - a.likes); // proxy
    // Recent: pinned first, then by date
    return arr.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [searchFiltered, feedTab]);

  // Grouped announcements card only shown in "All Posts" view
  const announcementPosts = useMemo(
    () =>
      activeChannel === "All Posts"
        ? sortedPosts.filter((p) => p.channel === "Announcements")
        : [],
    [sortedPosts, activeChannel]
  );

  // Regular full post cards — exclude announcements only in "All Posts" view (they show in the grouped card)
  const regularPosts = useMemo(
    () =>
      activeChannel === "All Posts"
        ? sortedPosts.filter((p) => p.channel !== "Announcements")
        : sortedPosts,
    [sortedPosts, activeChannel]
  );

  const handlePublish = async (title: string, body: string, channel: string, imageUrl?: string) => {
    const ok = await createPost(title, body, channel, imageUrl);
    if (ok) setModalOpen(false);
  };

  const defaultChannel = activeChannel === "All Posts" ? "General Discussion" : activeChannel;

  return (
    <div className="space-y-4">
      <CreatePostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPublish={handlePublish}
        defaultChannel={defaultChannel}
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search posts by title, content, or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
        />
      </div>

      {/* Feed tabs */}
      <div className="flex items-center gap-2">
        {(["Recent", "Trending", "Most Discussed"] as FeedTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFeedTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              feedTab === tab
                ? "bg-violet-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab === "Recent" && "🕐"}
            {tab === "Trending" && "🔥"}
            {tab === "Most Discussed" && "💬"}
            {tab}
          </button>
        ))}
      </div>

      {/* Post composer */}
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        <img
          src="https://ui-avatars.com/api/?name=Me&background=7c3aed&color=fff&size=40"
          alt="me"
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <span className="flex-1 text-sm text-gray-400 select-none">
          Share something with the community...
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Upcoming event banner */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-center gap-2 text-sm text-gray-700 shadow-sm">
        <CalendarDays className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span>
          <span className="font-semibold text-gray-900">Mindset Call with Coach Hope</span>
          {" "}is happening in about 2 hours
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Announcements grouped card */}
      {!loading && announcementPosts.length > 0 && (
        <AnnouncementsCard posts={announcementPosts} />
      )}

      {/* Regular post cards */}
      {!loading && regularPosts.length === 0 && announcementPosts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">No posts yet. Be the first to share something!</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
          >
            Create a post
          </button>
        </div>
      )}

      {!loading && regularPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onDelete={deletePost}
          onEdit={updatePost}
          onTogglePin={togglePin}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

export default CommunityFeed;
