import { useState, useRef, useEffect, useMemo } from "react";
import { Bookmark, MoreHorizontal, Plus, ChevronDown, Check } from "lucide-react";
import CreatePostModal from "./CreatePostModal";

const POSTS = [
  {
    id: 1,
    author: "Sarah Chen",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1&color=fff&size=40",
    time: "1d",
    daysAgo: 1,
    likes: 42,
    channel: "Community",
    headline: "How I closed a $15k analytics project — without a single cold email",
    body: "Six months ago I was sending 50 cold emails a week and getting maybe 2 replies. Today I have a waitlist of clients and haven't sent an outbound message in 3 months. Here's the exact shift that changed everything for me, and how you can replicate it without being an extrovert or having a massive following…",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    bookmarked: false,
  },
  {
    id: 2,
    author: "Marcus Williams",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Williams&background=f59e0b&color=fff&size=40",
    time: "2d",
    daysAgo: 2,
    likes: 18,
    channel: "Insights",
    headline: "The 3 metrics every data freelancer should track (and most don't)",
    body: "After coaching 200+ freelancers I've noticed a pattern: the ones who struggle focus on revenue. The ones who thrive focus on something else entirely. I'm going to share those 3 metrics with you today, and explain why tracking them changed the trajectory of my business in just 90 days…",
    image: null,
    bookmarked: true,
  },
  {
    id: 3,
    author: "Priya Nair",
    avatar: "https://ui-avatars.com/api/?name=Priya+Nair&background=10b981&color=fff&size=40",
    time: "3d",
    daysAgo: 3,
    likes: 97,
    channel: "Community",
    headline: "Just hit $100k in freelance revenue 🎉 Here's what nobody tells you",
    body: "It took me 18 months. I made every mistake in the book: undercharging, overdelivering, scope creep, nightmare clients, burnout. But I also figured out what works. I'm sharing the full breakdown — monthly revenue, client mix, tools, everything — because I wish someone had shown me this when I started…",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    bookmarked: false,
  },
];

const SORT_OPTIONS = [
  "For you",
  "Alphabetical",
  "Latest",
  "Likes",
  "New activity",
  "Oldest",
  "Popular",
];

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  daysAgo: number;
  likes: number;
  channel: string;
  headline: string;
  body: string;
  image: string | null;
  bookmarked: boolean;
}

const PostCard = ({ post }: { post: Post }) => {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(post.bookmarked);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{post.author}</span>
                <span className="text-gray-400 text-xs">{post.time}</span>
              </div>
              <span className="text-gray-500 text-xs">Posted in {post.channel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                bookmarked ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 text-base mb-2">{post.headline}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {expanded ? post.body : post.body.slice(0, 160) + "…"}
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="ml-1 text-blue-600 font-medium hover:underline"
            >
              See more
            </button>
          )}
        </p>
      </div>

      {post.image && (
        <div className="border-t border-gray-100">
          <img
            src={post.image}
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
    const posts = [...POSTS];
    switch (sort) {
      case "Alphabetical":
        return posts.sort((a, b) => a.headline.localeCompare(b.headline));
      case "Latest":
        return posts.sort((a, b) => a.daysAgo - b.daysAgo);
      case "Oldest":
        return posts.sort((a, b) => b.daysAgo - a.daysAgo);
      case "Likes":
      case "Popular":
        return posts.sort((a, b) => b.likes - a.likes);
      case "New activity":
        return posts.sort((a, b) => a.daysAgo - b.daysAgo);
      case "For you":
      default:
        return posts;
    }
  }, [sort]);

  return (
    <div className="space-y-4">
      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} />

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
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel */}
            <div
              className={`absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-150 origin-top-right ${
                sortOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
              style={{ width: "340px" }}
            >
              <div className="py-2">
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sort === option;
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        setSort(option);
                        setSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-left transition-colors hover:bg-gray-50 ${
                        isSelected ? "font-semibold text-gray-900" : "font-normal text-gray-800"
                      }`}
                      style={{
                        fontSize: "18px",
                        paddingLeft: "24px",
                        paddingRight: "20px",
                        paddingTop: "14px",
                        paddingBottom: "14px",
                      }}
                    >
                      {option}
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
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

      {/* Post cards */}
      {sortedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default CommunityFeed;
