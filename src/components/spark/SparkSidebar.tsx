import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Users,
  FileText,
  LayoutDashboard,
  Pencil,
  Target,
  Clock,
  MoreHorizontal,
  Star,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Lock,
  UserPlus,
  HelpCircle,
  FolderOpen,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SparkProject } from "@/hooks/useSparkProjects";

type Props = {
  projects: SparkProject[];
  selectedProjectId: string | null;
  onSelectProject: (project: SparkProject) => void;
  onBack: () => void;
};

const navItems = [
  { icon: Home, label: "Home", active: true },
  { icon: Compass, label: "Scope", tooltip: "Scope the solution" },
  { icon: Users, label: "Teams" },
  { icon: FileText, label: "Docs" },
  { icon: LayoutDashboard, label: "Dashboards" },
  { icon: Pencil, label: "Whiteboards" },
  { icon: Target, label: "Goals" },
  { icon: Clock, label: "Timesheets" },
  { icon: MoreHorizontal, label: "More" },
];

const workspaceColors: Record<number, string> = {
  0: "bg-spark-accent-purple",
  1: "bg-cyan-500",
  2: "bg-pink-500",
  3: "bg-emerald-500",
  4: "bg-orange-500",
};

const SparkSidebar = ({ projects, selectedProjectId, onSelectProject, onBack }: Props) => {
  const [spacesExpanded, setSpacesExpanded] = useState(true);
  const navigate = useNavigate();

  return (
    <aside className="w-[260px] flex-shrink-0 bg-spark-sidebar-bg border-r border-spark-card-border flex flex-col h-full overflow-hidden">
      {/* Workspace header */}
      <div className="px-3 py-3 border-b border-spark-card-border">
        <button
          className="flex items-center gap-2.5 w-full hover:bg-black/5 rounded-lg px-2 py-1.5 transition-colors"
          onClick={onBack}
        >
          <Avatar className="h-7 w-7 rounded-md">
            <AvatarFallback className="bg-teal-500 text-white text-xs font-bold rounded-md">
              B
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-spark-sidebar-foreground truncate flex-1 text-left">
            Blend AI tech...
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="px-2 py-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            title={"tooltip" in item ? (item as any).tooltip : undefined}
            className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors ${
              "active" in item && item.active
                ? "bg-primary/10 text-primary font-medium"
                : "text-spark-sidebar-foreground hover:bg-black/5"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Favorites */}
      <div className="px-2 py-1">
        <button className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground w-full">
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium">Favorites</span>
        </button>
      </div>

      {/* Spaces / Projects */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <button
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setSpacesExpanded(!spacesExpanded)}
          >
            {spacesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Spaces
          </button>
          <div className="flex items-center gap-0.5">
            <button className="p-1 rounded hover:bg-black/5 text-muted-foreground">
              <Search className="w-3 h-3" />
            </button>
            <button className="p-1 rounded hover:bg-black/5 text-muted-foreground">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {spacesExpanded && (
          <div className="space-y-0.5 pl-1">
            {/* All projects */}
            <button className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-spark-sidebar-foreground hover:bg-black/5">
              <Star className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Everything</span>
            </button>

            {projects.map((project, idx) => {
              const isActive = project.id === selectedProjectId;
              const colorClass = workspaceColors[idx % 5];
              const initial = project.name.charAt(0).toUpperCase();

              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-spark-sidebar-foreground hover:bg-black/5"
                  }`}
                >
                  <Avatar className="h-5 w-5 rounded">
                    <AvatarFallback className={`${colorClass} text-white text-[10px] font-bold rounded`}>
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1 text-left">{project.name}</span>
                </button>
              );
            })}

            {/* Create space */}
            <button
              onClick={onBack}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-black/5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Space</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-2.5 border-t border-spark-card-border flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <UserPlus className="w-3.5 h-3.5" />
          Invite
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-3.5 h-3.5" />
          Help
        </button>
      </div>
    </aside>
  );
};

export default SparkSidebar;
