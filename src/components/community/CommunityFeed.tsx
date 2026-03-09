import { useState } from "react";
import { Bookmark, MoreHorizontal, Plus, ChevronDown, ImageIcon } from "lucide-react";
import CreatePostModal from "./CreatePostModal";

const POSTS = [
  {
    id: 1,
    author: "Sarah Chen",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1&color=fff&size=40",
    time: "1d",
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
    channel: "Community",
    headline: "Just hit $100k in freelance revenue 🎉 Here's what nobody tells you",
    body: "It took me 18 months. I made every mistake in the book: undercharging, overdelivering, scope creep, nightmare clients, burnout. But I also figured out what works. I'm sharing the full breakdown — monthly revenue, client mix, tools, everything — because I wish someone had shown me this when I started…",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    bookmarked: false,
  },
];

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
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
        {/* Header */}
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

        {/* Body */}
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

      {/* Attached image */}
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
  const [postText, setPostText] = useState("");

  return (
    <div className="space-y-4">
      {/* Feed header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Feed</h2>
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              {sort}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                {["Latest", "Trending", "Top"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                      sort === s ? "text-blue-600 font-medium" : "text-gray-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
            New post
          </button>
        </div>
      </div>

      {/* Post composer */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <img
          src="https://ui-avatars.com/api/?name=Me&background=2563EB&color=fff&size=40"
          alt="me"
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <input
          type="text"
          placeholder="Start a post…"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
        />
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post cards */}
      {POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default CommunityFeed;
