import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Plug,
  Search,
  Shield,
  BookOpen,
  Eye,
  FileEdit,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  FileText,
  Kanban,
  ListTodo,
  IterationCcw,
  Truck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.jpeg";

const sidebarLinks = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "SPARK Framework", icon: Sparkles, href: "/dashboard/spark" },
  { label: "Platform Connections", icon: Plug, href: "/dashboard/connections" },
  { label: "Best Practices", icon: Search, href: "/dashboard/best-practices" },
  { label: "Scanner", icon: Shield, href: "/dashboard/scanner" },
  { label: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
  { label: "Design Visualizer", icon: Eye, href: "/dashboard/visualizer" },
  { label: "Proposal Writer", icon: FileEdit, href: "/dashboard/proposal-writer" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const boardsSubItems = [
  { label: "Work Items", icon: ListTodo },
  { label: "Boards", icon: Kanban },
  { label: "Backlogs", icon: IterationCcw },
  { label: "Sprints", icon: Sparkles },
  { label: "Delivery Plans", icon: Truck },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <img src={logo} alt="EZShield+AI" className="h-8 w-auto rounded-md" />
          <span className="font-heading font-bold text-foreground">EZShield+AI</span>
        </div>

        <nav className="p-3 space-y-1">
          {/* Top section: Dashboards, Wikis, Boards */}
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full">
            <LayoutDashboard className="w-4 h-4" />
            Dashboards
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full">
            <FileText className="w-4 h-4" />
            Wikis
          </button>

          {/* Boards - collapsible */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full group">
                <Kanban className="w-4 h-4" />
                <span className="flex-1 text-left">Boards</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 pl-3 border-l border-border space-y-0.5 py-0.5">
                {boardsSubItems.map((sub) => (
                  <button
                    key={sub.label}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
                  >
                    <sub.icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="my-2 border-t border-border" />

          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center px-4 lg:px-6">
          <button className="lg:hidden mr-3 text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
