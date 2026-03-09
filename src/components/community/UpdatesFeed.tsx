import { useState } from "react";
import { Bell, Bookmark, MoreHorizontal, Heart, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Announcement {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  date: string;
  hook: string;
  taggedUser?: string;
  body: string;
  likes: number;
  comments: number;
  likers: string[];
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "1",
    title: "Meet Cinthia - Our New Customer Success Manager",
    author: {
      name: "Dave Ebbelaar",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      bio: "Founder of Datalumina® | Teaching Developers How to Build AI Systems | Mentor for..."
    },
    date: "Feb 17",
    taggedUser: "@Cinthia",
    hook: "has joined Datalumina as our new Customer Success Manager!",
    body: "We're thrilled to welcome Cinthia to our growing team. She brings over 8 years of experience in customer success and community management from leading tech companies. Cinthia will be your go-to person for any questions about your membership, learning path recommendations, and ensuring you get the most out of your Datalumina experience. Feel free to reach out to her anytime - she's here to help you succeed on your data journey!",
    likes: 47,
    comments: 12,
    likers: ["JD", "MK", "AS"]
  },
  {
    id: "2",
    title: "New Course Launch: Advanced RAG Systems with LangChain",
    author: {
      name: "Dave Ebbelaar",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      bio: "Founder of Datalumina® | Teaching Developers How to Build AI Systems | Mentor for..."
    },
    date: "Feb 10",
    hook: "🚀 Big announcement!",
    body: "After months of development, we're excited to release our most comprehensive course yet on Retrieval Augmented Generation. This 12-module course covers everything from basic vector databases to production-grade RAG pipelines. You'll learn how to build systems that can query millions of documents in milliseconds while maintaining context accuracy. Early access is now available for Pro members!",
    likes: 156,
    comments: 34,
    likers: ["TW", "RB", "KL"]
  },
  {
    id: "3",
    title: "Platform Maintenance Scheduled - Feb 25th",
    author: {
      name: "Tech Team",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      bio: "Datalumina Engineering & Infrastructure Team | Keeping things running smoothly..."
    },
    date: "Feb 5",
    hook: "⚠️ Scheduled maintenance notice:",
    body: "We'll be performing infrastructure upgrades on February 25th from 2:00 AM to 6:00 AM UTC. During this time, the platform may experience brief interruptions. This upgrade will improve video streaming performance and reduce loading times across all courses. We appreciate your patience!",
    likes: 23,
    comments: 5,
    likers: ["NP", "SD", "VK"]
  }
];

const UpdatesFeed = () => {
  const [joined, setJoined] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(MOCK_ANNOUNCEMENTS.map(a => [a.id, a.likes]))
  );

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLikeCounts(counts => ({ ...counts, [id]: counts[id] - 1 }));
      } else {
        next.add(id);
        setLikeCounts(counts => ({ ...counts, [id]: counts[id] + 1 }));
      }
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">Updates</h1>
        </div>
        <Button
          onClick={() => setJoined(!joined)}
          className={`rounded-full px-5 ${
            joined
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
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

      {/* Hero Banner */}
      <div className="relative h-[200px] rounded-xl overflow-hidden bg-gray-900">
        {/* Geometric grid pattern */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMaxYMid slice">
            <defs>
              <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
              </linearGradient>
            </defs>
            {/* Generate grid of squares with varying opacity */}
            {Array.from({ length: 20 }).map((_, row) =>
              Array.from({ length: 40 }).map((_, col) => {
                const x = col * 20;
                const y = row * 10;
                const density = (col / 40) * Math.random();
                const opacity = density > 0.3 ? density * 0.8 : 0;
                const colors = ["#3B82F6", "#1D4ED8", "#60A5FA", "#2563EB", "#1E40AF"];
                const color = colors[Math.floor(Math.random() * colors.length)];
                return opacity > 0.1 ? (
                  <rect
                    key={`${row}-${col}`}
                    x={x}
                    y={y}
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
        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center px-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Latest Platform
              <br />
              Updates
            </h2>
          </div>
        </div>
      </div>

      {/* Announcement Cards */}
      <div className="space-y-4">
        {MOCK_ANNOUNCEMENTS.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">
                {post.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(post.id)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      bookmarkedPosts.has(post.id)
                        ? "fill-gray-700 text-gray-700"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Author Row */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="w-11 h-11">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{post.author.name}</span>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                  <span className="text-gray-500 text-sm">{post.date}</span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {post.author.bio}
                </p>
              </div>
            </div>

            {/* Post Body */}
            <div className="mb-4">
              <p className="text-gray-700">
                {post.taggedUser && (
                  <span className="text-blue-600 font-bold">{post.taggedUser} </span>
                )}
                <span className="text-blue-600 font-bold">{post.hook}</span>
              </p>
              <p
                className={`text-gray-600 mt-2 ${
                  expandedPosts.has(post.id) ? "" : "line-clamp-3"
                }`}
              >
                {post.body}
              </p>
              {post.body.length > 150 && (
                <button
                  onClick={() => toggleExpand(post.id)}
                  className="text-gray-500 text-sm mt-1 hover:text-gray-700"
                >
                  {expandedPosts.has(post.id) ? "See less" : "See more"}
                </button>
              )}
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedPosts.has(post.id)
                        ? "fill-red-500 text-red-500"
                        : ""
                    }`}
                  />
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {/* Overlapping avatars */}
                <div className="flex -space-x-2">
                  {post.likers.map((initials, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {likeCounts[post.id]} likes · {post.comments} comments
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpdatesFeed;
