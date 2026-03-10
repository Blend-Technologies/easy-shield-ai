import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Home,
  Compass,
  Users,
  FileEdit,
  ClipboardCheck,
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
  ListTodo,
  Kanban,
  IterationCcw,
  Sparkles,
  Truck,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SparkProject } from "@/hooks/useSparkProjects";
import { useTeams } from "@/hooks/useTeams";
import CreateTeamDialog from "@/components/spark/CreateTeamDialog";

type Props = {
  projects: SparkProject[];
  selectedProjectId: string | null;
  onSelectProject: (project: SparkProject) => void;
  onBack: () => void;
};

const navItems = [
  { icon: LayoutDashboard, label: "Dashboards" },
  { icon: Pencil, label: "Whiteboards" },
  { icon: Target, label: "Goals" },
  { icon: Clock, label: "Timesheets" },
  { icon: MoreHorizontal, label: "More" },
];

const scopeSubItems = [
  { icon: ClipboardCheck, label: "Proposal Evaluator", href: "/dashboard/proposal-evaluator" },
  { icon: FileEdit, label: "Proposal Writer", href: "/dashboard/proposal-writer" },
];

const getDashboardSubItems = (projectName: string) => [
  { icon: LayoutDashboard, label: "Dashboard", href: `/dashboard/${encodeURIComponent(projectName)}/analytics` },
];

const getTasksSubItems = (projectName: string) => [
  { icon: ListTodo, label: "Work Items", href: `/dashboard/${encodeURIComponent(projectName)}/work-items` },
  { icon: Sparkles, label: "Sprints", href: `/dashboard/${encodeURIComponent(projectName)}/boards` },
  { icon: Truck, label: "Delivery Plans", href: "" },
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
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const navigate = useNavigate();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const { teams, isLoading: teamsLoading, createTeam, deleteTeam } = useTeams(selectedProjectId);
  const dashboardSubItems = getDashboardSubItems(selectedProject?.name || "");
  const tasksSubItems = getTasksSubItems(selectedProject?.name || "");

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
            Testing
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="px-2 py-2 space-y-0.5">
        {/* Home - always on top */}
        <button
          className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors bg-primary/10 text-primary font-medium"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Home</span>
        </button>

        {/* Scope with dropdown */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <button
              title="Scope the solution"
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors text-spark-sidebar-foreground hover:bg-black/5 group"
            >
              <Compass className="w-4 h-4 flex-shrink-0" style={{ color: "#7B68EE" }} />
              <span className="flex-1 text-left font-medium bg-gradient-to-r from-spark-accent-purple to-primary bg-clip-text text-transparent">
                Scope
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 pl-2.5 border-l border-spark-card-border space-y-0.5 py-0.5">
              {scopeSubItems.map((sub) => (
                <button
                  key={sub.label}
                  onClick={() => navigate(sub.href)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-spark-sidebar-foreground hover:bg-black/5 transition-colors"
                >
                  <sub.icon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="text-left">{sub.label}</span>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Teams with Tasks Management nested */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors text-spark-sidebar-foreground hover:bg-black/5 group"
            >
              <Users className="w-4 h-4 flex-shrink-0 text-primary" />
              <span className="flex-1 text-left font-medium">Teams</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 pl-2.5 border-l border-spark-card-border space-y-0.5 py-0.5">
              {/* My Teams sub-section */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <button
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors text-spark-sidebar-foreground hover:bg-black/5 group"
                  >
                    <Users className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left font-medium">My Teams</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCreateTeamOpen(true); }}
                      className="p-0.5 rounded hover:bg-black/10 text-muted-foreground"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 pl-2.5 border-l border-spark-card-border space-y-0.5 py-0.5">
                    {teams.length === 0 && !teamsLoading && (
                      <p className="text-xs text-muted-foreground px-2.5 py-1">No teams yet</p>
                    )}
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-spark-sidebar-foreground hover:bg-black/5 transition-colors group/team"
                      >
                        <Avatar className="h-5 w-5 rounded">
                          <AvatarFallback
                            className="text-white text-[10px] font-bold rounded"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate flex-1 text-left">{team.name}</span>
                        <button
                          onClick={() => deleteTeam.mutate(team.id)}
                          className="opacity-0 group-hover/team:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Tasks Management sub-section */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <button
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors text-spark-sidebar-foreground hover:bg-black/5 group"
                  >
                    <Kanban className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left font-medium">Tasks Management</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 pl-2.5 border-l border-spark-card-border space-y-0.5 py-0.5">
                    {/* Dashboard section */}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pt-2 pb-1">Dashboard</p>
                    {dashboardSubItems.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => navigate(sub.href)}
                        className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-spark-sidebar-foreground hover:bg-black/5 transition-colors"
                      >
                        <sub.icon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="text-left">{sub.label}</span>
                      </button>
                    ))}

                    {/* Tasks section */}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pt-2 pb-1">Tasks</p>
                    {tasksSubItems.map((sub) =>
                      sub.href ? (
                        <button
                          key={sub.label}
                          onClick={() => navigate(sub.href)}
                          className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-spark-sidebar-foreground hover:bg-black/5 transition-colors"
                        >
                          <sub.icon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                          <span className="text-left">{sub.label}</span>
                        </button>
                      ) : (
                        <button
                          key={sub.label}
                          className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-black/5 transition-colors"
                        >
                          <sub.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-left">{sub.label}</span>
                        </button>
                      )
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Other nav items */}
        {navItems.map((item) => (
          <button
            key={item.label}
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
