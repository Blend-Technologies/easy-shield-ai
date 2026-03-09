const TRENDING = [
  {
    id: 1,
    title: "How I landed my first $10k data freelance contract",
    author: "Sarah Chen",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1&color=fff&size=40",
  },
  {
    id: 2,
    title: "The best tools for building a data portfolio in 2025",
    author: "Marcus Williams",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Williams&background=f59e0b&color=fff&size=40",
  },
  {
    id: 3,
    title: "Pricing your analytics services: a complete guide",
    author: "Priya Nair",
    avatar: "https://ui-avatars.com/api/?name=Priya+Nair&background=10b981&color=fff&size=40",
  },
  {
    id: 4,
    title: "Stop doing these 5 things on your LinkedIn profile",
    author: "Tom Bradley",
    avatar: "https://ui-avatars.com/api/?name=Tom+Bradley&background=ef4444&color=fff&size=40",
  },
  {
    id: 5,
    title: "From analyst to consultant: my 6-month journey",
    author: "Anita Patel",
    avatar: "https://ui-avatars.com/api/?name=Anita+Patel&background=8b5cf6&color=fff&size=40",
  },
];

const CommunityRightSidebar = () => {
  return (
    <aside className="fixed top-14 right-0 bottom-0 w-[260px] bg-white border-l border-gray-200 overflow-y-auto z-30 py-5 px-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Trending posts</h3>
      <div className="space-y-4">
        {TRENDING.map((post) => (
          <button
            key={post.id}
            className="w-full flex items-start gap-3 text-left group"
          >
            <img
              src={post.avatar}
              alt={post.author}
              className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {post.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{post.author}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default CommunityRightSidebar;
