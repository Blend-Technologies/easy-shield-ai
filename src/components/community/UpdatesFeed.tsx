import { useState } from "react";
import { Bell, Bookmark, MoreHorizontal, Heart, MessageCircle, Check, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import CreateAnnouncementModal from "./CreateAnnouncementModal";

const UpdatesFeed = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { announcements, loading: announcementsLoading, createAnnouncement } = useAnnouncements();
  const [joined, setJoined] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePublishAnnouncement = async (title: string, hook: string, body: string) => {
    await createAnnouncement(title, hook, body);
    setModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Updates</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !adminLoading && (
            <Button
              onClick={() => setModalOpen(true)}
              className="rounded-full px-5 bg-[#6B4EFF] hover:bg-[#5A3EE6] text-white flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </Button>
          )}
          <Button
            onClick={() => setJoined(!joined)}
            className={`rounded-full px-5 ${
              joined
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#6B4EFF] hover:bg-[#5A3EE6]"
            } text-white`}
          >
            {joined ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Joined
              </>
            ) : (
              "Join space"
            )}
          </Button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative h-[200px] rounded-xl overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMaxYMid slice">
            {Array.from({ length: 20 }).map((_, row) =>
              Array.from({ length: 40 }).map((_, col) => {
                const density = (col / 40) * Math.random();
                const opacity = density > 0.3 ? density * 0.8 : 0;
                const colors = ["#3B82F6", "#1D4ED8", "#60A5FA", "#2563EB", "#1E40AF"];
                const color = colors[Math.floor(Math.random() * colors.length)];
                return opacity > 0.1 ? (
                  <rect
                    key={`${row}-${col}`}
                    x={col * 20}
                    y={row * 10}
                    width="8"
                    height="8"
                    fill={color}
                    opacity={opacity}
                    rx="1"
                  />
                ) : null;
              })
            )}
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Latest Platform
            <br />
            Updates
          </h2>
        </div>
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#6B4EFF]/10 border border-[#6B4EFF]/20 rounded-lg text-sm text-[#6B4EFF]">
          <span className="font-semibold">Admin view</span>
          <span className="text-[#6B4EFF]/70">— You can create announcements in this space.</span>
        </div>
      )}

      {/* Loading state */}
      {announcementsLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!announcementsLoading && announcements.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No announcements yet</p>
          {isAdmin && <p className="text-sm mt-1">Create your first announcement above.</p>}
        </div>
      )}

      {/* Announcement Cards */}
      <div className="space-y-4">
        {announcements.map((post) => (
          <div
            key={post.id}
            className="bg-card rounded-xl border border-border shadow-sm p-6"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex-1 pr-4">{post.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(post.id)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      bookmarkedPosts.has(post.id) ? "fill-foreground text-foreground" : "text-muted-foreground"
                    }`}
                  />
                </button>
                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Author Row */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="w-11 h-11">
                <AvatarImage src={post.author_avatar || undefined} alt={post.author_name || "Admin"} />
                <AvatarFallback>{(post.author_name || "A").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{post.author_name || "Admin"}</span>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                  <span className="text-muted-foreground text-sm">{formatDate(post.created_at)}</span>
                </div>
                {post.author_bio && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{post.author_bio}</p>
                )}
              </div>
            </div>

            {/* Post Body */}
            <div className="mb-4">
              {post.hook && (
                <p className="text-blue-600 font-bold">{post.hook}</p>
              )}
              <p className={`text-muted-foreground mt-2 ${expandedPosts.has(post.id) ? "" : "line-clamp-3"}`}>
                {post.body}
              </p>
              {post.body.length > 150 && (
                <button
                  onClick={() => toggleExpand(post.id)}
                  className="text-muted-foreground text-sm mt-1 hover:text-foreground"
                >
                  {expandedPosts.has(post.id) ? "See less" : "See more"}
                </button>
              )}
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${likedPosts.has(post.id) ? "fill-red-500 text-red-500" : ""}`}
                  />
                </button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPublish={handlePublishAnnouncement}
      />
    </div>
  );
};

export default UpdatesFeed;
