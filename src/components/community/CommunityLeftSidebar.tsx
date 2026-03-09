import { useState } from "react";
import { ExternalLink, MoreHorizontal, BookOpen, CalendarDays, BarChart2, HelpCircle, Users, Megaphone, LifeBuoy } from "lucide-react";

interface SidebarItem {
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
  external?: boolean;
  active?: boolean;
}

interface SidebarGroup {
  title: string;
  hasOptions?: boolean;
  items: SidebarItem[];
}

const GROUPS: SidebarGroup[] = [
  {
    title: "Welcome",
    items: [
      { label: "Community", icon: Users, badge: 62, active: true },
      { label: "Updates", icon: Megaphone },
    ],
  },
  {
    title: "Data Freelancer",
    hasOptions: true,
    items: [
      { label: "Course", icon: BookOpen },
      { label: "Events", icon: CalendarDays },
      { label: "Insights", icon: BarChart2, badge: 1 },
    ],
  },
  {
    title: "Links",
    items: [
      { label: "Support", icon: LifeBuoy, external: true },
    ],
  },
];

interface CommunityLeftSidebarProps {
  activeItem: string;
  onItemClick: (label: string) => void;
}

const CommunityLeftSidebar = ({ activeItem, onItemClick }: CommunityLeftSidebarProps) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-[260px] bg-gray-50 border-r border-gray-200 overflow-y-auto z-30 py-4">
      {GROUPS.map((group) => (
        <div key={group.title} className="mb-4">
          {/* Group header */}
          <div
            className="flex items-center justify-between px-4 mb-1"
            onMouseEnter={() => setHoveredGroup(group.title)}
            onMouseLeave={() => setHoveredGroup(null)}
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.title}
            </span>
            {group.hasOptions && (
              <button
                className={`w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all ${
                  hoveredGroup === group.title ? "opacity-100" : "opacity-0"
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Items */}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;
            return (
              <button
                key={item.label}
                onClick={() => onItemClick(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2 mx-0 text-sm transition-colors group ${
                  isActive
                    ? "bg-gray-200 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`}
                  />
                )}
                <span className="flex-1 text-left truncate">{item.label}</span>

                {item.badge !== undefined && (
                  <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}

                {item.external && (
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

export default CommunityLeftSidebar;
