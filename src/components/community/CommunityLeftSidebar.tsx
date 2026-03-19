import LeaderboardWidget from "@/components/community/LeaderboardWidget";

interface SidebarItem {
  label: string;
  emoji: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const GROUPS: SidebarGroup[] = [
  {
    title: "GENERAL",
    items: [
      { label: "Announcements", emoji: "📢" },
      { label: "All Posts", emoji: "📋" },
      { label: "Introductions", emoji: "👋" },
      { label: "Wins & Milestones", emoji: "🏆" },
      { label: "Share Progress", emoji: "📝" },
      { label: "Promotion", emoji: "🎉" },
    ],
  },
  {
    title: "HELP & LEARNING",
    items: [
      { label: "Q&A", emoji: "❓" },
      { label: "Technical Support", emoji: "🔧" },
      { label: "Feedback Requests", emoji: "💡" },
      { label: "Resources & Tools", emoji: "📦" },
    ],
  },
  {
    title: "DISCUSSION",
    items: [
      { label: "General Discussion", emoji: "💬" },
      { label: "Ideas & Brainstorming", emoji: "🧠" },
      { label: "Showcase", emoji: "🎯" },
    ],
  },
];

interface CommunityLeftSidebarProps {
  activeItem: string;
  onItemClick: (label: string) => void;
  showBanner?: boolean;
}

const CommunityLeftSidebar = ({ activeItem, onItemClick, showBanner = true }: CommunityLeftSidebarProps) => {
  return (
    <aside className={`fixed left-0 bottom-0 w-[260px] bg-muted/50 border-r border-border overflow-y-auto z-30 flex flex-col ${showBanner ? "top-[96px]" : "top-14"}`}>
      <div className="flex-1 py-4">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="px-4 mb-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                {group.title}
              </span>
            </div>

            {group.items.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => onItemClick(item.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{item.emoji}</span>
                  <span className="text-left truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <LeaderboardWidget />
    </aside>
  );
};

export default CommunityLeftSidebar;
