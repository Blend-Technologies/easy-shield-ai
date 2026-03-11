import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Settings,
  Circle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Plus,
  Link as LinkIcon,
  Layers,
  Filter,
  Check,
  Search,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SparkProject } from "@/hooks/useSparkProjects";
import { SparkTask, useSparkTasks } from "@/hooks/useSparkTasks";
import { useSparkActivity } from "@/hooks/useSparkActivity";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const phases = [
  { key: "S", label: "Scope" },
  { key: "P", label: "Protect" },
  { key: "A", label: "Assemble" },
  { key: "R", label: "Review" },
  { key: "K", label: "Kickoff" },
];

type Props = {
  project: SparkProject;
};

const SparkDashboardContent = ({ project }: Props) => {
  const { tasks, addTask, updateTaskStatus } = useSparkTasks(project.id);
  const { activity, logActivity } = useSparkActivity(project.id);
  const [userName, setUserName] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] = useState("S");
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [assignedExpanded, setAssignedExpanded] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "there");
      }
    };
    fetchUser();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => t.due_date === today && t.status !== "done");
  }, [tasks]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask({ title: newTaskTitle.trim(), phase: newTaskPhase });
    await logActivity("task_created", `Created task "${newTaskTitle.trim()}"`);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const handleStatusChange = async (task: SparkTask, newStatus: string) => {
    await updateTaskStatus(task.id, newStatus);
    await logActivity("status_changed", `Moved "${task.title}" to ${newStatus}`);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-spark-card-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="w-4 h-4" />
          <span className="font-medium text-foreground">Home</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 rounded-full bg-spark-nav text-spark-nav-foreground border-0 hover:bg-spark-nav/90 hover:text-spark-nav-foreground">
            Manage cards
          </Button>
          <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Greeting */}
          <h1 className="font-heading text-[28px] font-bold text-foreground mb-6">
            {greeting}, {userName}
          </h1>

          {/* Card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left column */}
            <div className="lg:col-span-3 space-y-5">
              {/* Recents */}
              <div className="bg-card rounded-xl border border-spark-card-border shadow-sm">
                <div className="px-5 py-3.5 border-b border-spark-card-border">
                  <h2 className="font-semibold text-foreground text-sm">Recents</h2>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {(activity.length > 0 ? activity : []).map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <Circle className="w-4 h-4 text-spark-card-border flex-shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{item.description}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        • {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                  {activity.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No recent activity yet. Start by adding tasks!
                    </div>
                  )}
                </div>
              </div>

              {/* My Work */}
              <div className="bg-card rounded-xl border border-spark-card-border shadow-sm">
                <div className="px-5 py-3.5 border-b border-spark-card-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground text-sm">My Work</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs h-7"
                    onClick={() => setShowAddTask(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </Button>
                </div>

                <Tabs defaultValue="todo">
                  <div className="px-5 border-b border-spark-card-border">
                    <TabsList className="bg-transparent h-9 gap-4 p-0">
                      <TabsTrigger
                        value="todo"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 h-9 text-xs font-medium"
                      >
                        To Do
                        <span className="ml-1.5 text-muted-foreground">{todoTasks.length}</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="done"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 h-9 text-xs font-medium"
                      >
                        Done
                        <span className="ml-1.5 text-muted-foreground">{doneTasks.length}</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="delegated"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 h-9 text-xs font-medium"
                      >
                        Delegated
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {showAddTask && (
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-spark-card-border">
                      <Select value={newTaskPhase} onValueChange={setNewTaskPhase}>
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {phases.map((p) => (
                            <SelectItem key={p.key} value={p.key}>{p.key} – {p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                        className="h-7 text-sm flex-1"
                        autoFocus
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={handleAddTask}>Add</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddTask(false)}>Cancel</Button>
                    </div>
                  )}

                  <TabsContent value="todo" className="m-0">
                    {/* Collapsible today group */}
                    <button
                      className="flex items-center gap-2 px-5 py-2 w-full hover:bg-muted/30 text-sm"
                      onClick={() => setTodayExpanded(!todayExpanded)}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${!todayExpanded ? "-rotate-90" : ""}`} />
                      <span className="font-medium text-foreground">Today</span>
                      <span className="text-xs text-muted-foreground">{todoTasks.length}</span>
                    </button>
                    {todayExpanded && (
                      <div>
                        {todoTasks.length === 0 ? (
                          <div className="px-5 py-6 text-center text-sm text-muted-foreground">No tasks to do. Click "Add Task" to create one.</div>
                        ) : (
                          todoTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 px-5 py-2 hover:bg-muted/30 transition-colors">
                              <button onClick={() => handleStatusChange(task, "done")}>
                                <Circle className="w-4 h-4 text-spark-status-blue" />
                              </button>
                              <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {task.phase} – {phases.find((p) => p.key === task.phase)?.label}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="done" className="m-0">
                    {doneTasks.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-muted-foreground">No completed tasks yet</div>
                    ) : (
                      doneTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 px-5 py-2 hover:bg-muted/30 transition-colors">
                          <button onClick={() => handleStatusChange(task, "todo")}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </button>
                          <span className="text-sm text-muted-foreground line-through truncate flex-1">{task.title}</span>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="delegated" className="m-0">
                    <div className="px-5 py-6 text-center text-sm text-muted-foreground">No delegated tasks</div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Agenda */}
              <div className="bg-card rounded-xl border border-spark-card-border shadow-sm">
                <div className="px-5 py-3.5 border-b border-spark-card-border">
                  <h2 className="font-semibold text-foreground text-sm">Agenda</h2>
                </div>
                <div className="px-5 py-2.5 flex items-center justify-between border-b border-spark-card-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{dateStr}</span>
                    <div className="flex items-center gap-0.5">
                      <button className="p-0.5 rounded hover:bg-muted text-muted-foreground">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-0.5 rounded hover:bg-muted text-muted-foreground">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-muted-foreground hover:text-foreground">Today</button>
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  {todayTasks.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                      No tasks due today
                    </div>
                  ) : (
                    todayTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-spark-card-border flex-shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                        <span className="text-xs text-muted-foreground">All day</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assigned to me */}
              <div className="bg-card rounded-xl border border-spark-card-border shadow-sm">
                <div className="px-5 py-3.5 border-b border-spark-card-border">
                  <h2 className="font-semibold text-foreground text-sm">Assigned to me</h2>
                </div>
                {/* Toolbar */}
                <div className="px-5 py-2 flex items-center gap-1.5 border-b border-spark-card-border">
                  <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1" />
                  <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center bg-muted/50 rounded-md px-2 py-1">
                    <Search className="w-3 h-3 text-muted-foreground mr-1" />
                    <span className="text-xs text-muted-foreground">Search...</span>
                  </div>
                  <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* In Progress group */}
                <button
                  className="flex items-center gap-2 px-5 py-2 w-full hover:bg-muted/30"
                  onClick={() => setAssignedExpanded(!assignedExpanded)}
                >
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${!assignedExpanded ? "-rotate-90" : ""}`} />
                  <Badge className="bg-spark-status-blue/15 text-spark-status-blue border-spark-status-blue/30 text-[10px] font-semibold px-2 py-0">
                    IN PROGRESS
                  </Badge>
                  <span className="text-xs text-muted-foreground">{inProgressTasks.length}</span>
                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddTask(true);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    Add Task
                  </button>
                </button>

                {assignedExpanded && (
                  <>
                    {/* Column header */}
                    <div className="flex items-center justify-between px-5 py-1.5 border-b border-spark-card-border text-xs text-muted-foreground">
                      <span>Name</span>
                      <div className="flex items-center gap-2">
                        <span>Priority</span>
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>

                    {inProgressTasks.length === 0 ? (
                      <div className="px-5 py-4 text-center text-sm text-muted-foreground">
                        No in-progress tasks
                      </div>
                    ) : (
                      inProgressTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 px-5 py-2 hover:bg-muted/30 transition-colors">
                          <FileText className="w-3.5 h-3.5 text-spark-status-blue flex-shrink-0" />
                          <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                          <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SparkDashboardContent;
