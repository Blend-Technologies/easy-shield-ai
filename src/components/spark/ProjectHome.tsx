import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  CalendarDays,
  Sparkles,
  Settings,
  Compass,
  ShieldCheck,
  Wrench,
  ClipboardCheck,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  { key: "S", label: "Scope", icon: Compass, color: "text-neon-pink-400" },
  { key: "P", label: "Protect", icon: ShieldCheck, color: "text-indigo-bloom-300" },
  { key: "A", label: "Assemble", icon: Wrench, color: "text-electric-sapphire-300" },
  { key: "R", label: "Review", icon: ClipboardCheck, color: "text-sky-aqua-400" },
  { key: "K", label: "Kickoff", icon: Rocket, color: "text-vivid-royal-200" },
];

type Props = {
  project: SparkProject;
  onBack: () => void;
};

const ProjectHome = ({ project, onBack }: Props) => {
  const { tasks, loading, addTask, updateTaskStatus, deleteTask } = useSparkTasks(project.id);
  const { activity, logActivity } = useSparkActivity(project.id);
  const [userName, setUserName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] = useState("S");
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
        setUserName(name);
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
    const task = await addTask({ title: newTaskTitle.trim(), phase: newTaskPhase });
    if (task) {
      await logActivity("task_created", `Created task "${newTaskTitle.trim()}"`);
      setNewTaskTitle("");
      setShowAddTask(false);
    }
  };

  const handleStatusChange = async (task: SparkTask, newStatus: string) => {
    await updateTaskStatus(task.id, newStatus);
    await logActivity("status_changed", `Moved "${task.title}" to ${newStatus}`);
  };

  const getPhase = (key: string) => phases.find((p) => p.key === key) || phases[0];

  const statusBadge = (status: string) => {
    switch (status) {
      case "todo":
        return <Badge variant="outline" className="text-xs font-normal">To Do</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-normal">In Progress</Badge>;
      case "done":
        return <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs font-normal">Done</Badge>;
      default:
        return null;
    }
  };

  const TaskRow = ({ task }: { task: SparkTask }) => {
    const phase = getPhase(task.phase);
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group">
        <button
          onClick={() =>
            handleStatusChange(task, task.status === "done" ? "todo" : "done")
          }
          className="flex-shrink-0"
        >
          {task.status === "done" ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground/40 hover:text-primary transition-colors" />
          )}
        </button>
        <phase.icon className={`w-3.5 h-3.5 flex-shrink-0 ${phase.color}`} />
        <span className={`text-sm flex-1 truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </span>
        {task.due_date && (
          <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</span>
        )}
        {statusBadge(task.status)}
        <Select
          value={task.status}
          onValueChange={(v) => handleStatusChange(task, v)}
        >
          <SelectTrigger className="h-7 w-auto border-0 bg-transparent text-xs opacity-0 group-hover:opacity-100 transition-opacity p-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-heading font-semibold text-sm text-foreground">{project.name}</span>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-3.5 h-3.5" />
          Manage cards
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Greeting */}
          <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
            {greeting}, {userName}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Recents & My Work */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Recents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {activity.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No recent activity yet. Start by adding tasks!
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {activity.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                          <span className="text-sm text-foreground truncate flex-1">{item.description}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Work */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">My Work</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs h-7"
                      onClick={() => setShowAddTask(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="todo">
                    <div className="px-4">
                      <TabsList className="bg-transparent h-9 gap-4 p-0">
                        <TabsTrigger
                          value="todo"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 h-9 text-xs"
                        >
                          To Do
                          <span className="ml-1.5 text-muted-foreground">{todoTasks.length}</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="in_progress"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 h-9 text-xs"
                        >
                          In Progress
                          <span className="ml-1.5 text-muted-foreground">{inProgressTasks.length}</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="done"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 h-9 text-xs"
                        >
                          Done
                          <span className="ml-1.5 text-muted-foreground">{doneTasks.length}</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {showAddTask && (
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                        <Select value={newTaskPhase} onValueChange={setNewTaskPhase}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {phases.map((p) => (
                              <SelectItem key={p.key} value={p.key}>
                                {p.key} – {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                          className="h-8 text-sm flex-1"
                          autoFocus
                        />
                        <Button size="sm" className="h-8 text-xs" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAddTask(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}

                    <TabsContent value="todo" className="m-0">
                      {todoTasks.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks to do</div>
                      ) : (
                        <div className="divide-y divide-border">{todoTasks.map((t) => <TaskRow key={t.id} task={t} />)}</div>
                      )}
                    </TabsContent>
                    <TabsContent value="in_progress" className="m-0">
                      {inProgressTasks.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks in progress</div>
                      ) : (
                        <div className="divide-y divide-border">{inProgressTasks.map((t) => <TaskRow key={t.id} task={t} />)}</div>
                      )}
                    </TabsContent>
                    <TabsContent value="done" className="m-0">
                      {doneTasks.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No completed tasks</div>
                      ) : (
                        <div className="divide-y divide-border">{doneTasks.map((t) => <TaskRow key={t.id} task={t} />)}</div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Agenda & Assigned */}
            <div className="space-y-6">
              {/* Agenda */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Agenda</CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {todayTasks.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No tasks due today
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayTasks.map((task) => {
                        const phase = getPhase(task.phase);
                        return (
                          <div key={task.id} className="flex items-center gap-3">
                            <CheckCircle2 className={`w-4 h-4 ${phase.color}`} />
                            <span className="text-sm text-foreground truncate flex-1">{task.title}</span>
                            <span className="text-xs text-muted-foreground">All day</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SPARK Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">SPARK Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {phases.map((phase) => {
                      const phaseTasks = tasks.filter((t) => t.phase === phase.key);
                      const completed = phaseTasks.filter((t) => t.status === "done").length;
                      const total = phaseTasks.length;
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                      return (
                        <div key={phase.key} className="flex items-center gap-3">
                          <phase.icon className={`w-4 h-4 flex-shrink-0 ${phase.color}`} />
                          <span className="text-sm font-medium w-20">{phase.key} – {phase.label}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {completed}/{total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectHome;
