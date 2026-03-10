import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown, Plus, Search, Eye, Settings, LayoutGrid, List,
  Columns3, BarChart3, Table, Activity, Layers, GitBranch,
  CheckCircle2, Circle, Clock, MoreHorizontal, Flag, PlusCircle,
  AlignJustify, User, Filter, Sun, Moon, Trash2, ArrowLeft,
  RefreshCw, AlertTriangle, Pause,
} from "lucide-react";
import { useWorkItems, WorkItem } from "@/hooks/useWorkItems";
import { useSprints, Sprint } from "@/hooks/useSprints";
import { useProjectIdFromName } from "@/hooks/useProjectIdFromName";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { format, isToday, isPast } from "date-fns";
import TaskDetailDialog from "@/components/workitems/TaskDetailDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: BarChart3 },
  { id: "table", label: "Table", icon: Table },
  { id: "workload", label: "Workload", icon: Activity },
];

type StatusStyle = "backlog" | "in-progress" | "testing" | "at-risk" | "blocked" | "update-required" | "on-hold" | "complete" | "closed";

const statusGroups: { id: StatusStyle; label: string; color: string; iconColor: string }[] = [
  { id: "backlog", label: "BACKLOG", color: "#AAAAAA", iconColor: "#AAAAAA" },
  { id: "in-progress", label: "IN PROGRESS", color: "#7C3AED", iconColor: "#7C3AED" },
  { id: "testing", label: "TESTING", color: "#2563EB", iconColor: "#2563EB" },
  { id: "at-risk", label: "AT RISK", color: "#F57C00", iconColor: "#F57C00" },
  { id: "blocked", label: "BLOCKED", color: "#DC2626", iconColor: "#DC2626" },
  { id: "update-required", label: "UPDATE REQUIRED", color: "#F59E0B", iconColor: "#F59E0B" },
  { id: "on-hold", label: "ON HOLD", color: "#78350F", iconColor: "#78350F" },
  { id: "complete", label: "COMPLETE", color: "#00BFA5", iconColor: "#00BFA5" },
  { id: "closed", label: "CLOSED", color: "#6B7280", iconColor: "#6B7280" },
];

const WorkItems = () => {
  const navigate = useNavigate();
  const { projectName } = useParams();
  const projectId = useProjectIdFromName(projectName);
  const { members: projectMembers } = useProjectMembers(projectId);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    backlog: true, "in-progress": true, testing: true, "at-risk": true, blocked: true,
    "update-required": true, "on-hold": true, complete: true, closed: true,
  });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("none");
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);
  const { grouped, loading, addItem, updateItem, deleteItem } = useWorkItems();
  const { sprints, addSprint } = useSprints();

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const resetNewTask = () => {
    setNewTitle("");
    setNewAssignee("");
    setNewDueDate("");
    setNewPriority("none");
    setAddingTo(null);
  };

  const handleAddTask = async (status: string) => {
    if (!newTitle.trim()) return;
    await addItem({
      title: newTitle.trim(),
      status,
      assignee_initials: newAssignee || undefined,
      due_date: newDueDate || undefined,
      priority: newPriority,
    });
    resetNewTask();
  };

  const priorityOptions = [
    { value: "urgent", label: "Urgent", color: "text-red-500" },
    { value: "high", label: "High", color: "text-orange-500" },
    { value: "normal", label: "Normal", color: "text-blue-500" },
    { value: "low", label: "Low", color: "text-gray-400" },
    { value: "none", label: "None", color: "text-[#CCC]" },
  ];

  // Theme classes
  const pageBg = darkMode ? "bg-[#0D1F3C]" : "bg-white";
  const barBg = darkMode ? "bg-[#0D1F3C]" : "bg-white";
  const barBorder = darkMode ? "border-white/10" : "border-[#E5E5E5]";
  const textDark = darkMode ? "text-white" : "text-[#1A1A1A]";
  const textMuted = darkMode ? "text-gray-400" : "text-[#999]";
  const textMutedLight = darkMode ? "text-gray-500" : "text-[#AAA]";
  const rowDivider = darkMode ? "border-white/5" : "border-[#F0F0F0]";
  const rowHover = darkMode ? "hover:bg-white/5" : "hover:bg-[#FAFAFA]";
  const pillGroupBg = darkMode ? "bg-[#2a2050]" : "bg-[#EDE9FF]";
  const pillGroupText = darkMode ? "text-purple-300" : "text-[#7C3AED]";
  const pillSubBg = darkMode ? "bg-white/10" : "bg-[#F0F0F0]";
  const pillSubText = darkMode ? "text-gray-300" : "text-[#444]";
  const inputBorder = darkMode ? "border-white/20" : "border-[#E0E0E0]";
  const inputBg = darkMode ? "bg-white/5" : "bg-white";

  const StatusIcon = ({ style }: { style: StatusStyle }) => {
    const group = statusGroups.find((g) => g.id === style);
    const color = group?.color || "#CCC";
    if (style === "complete" || style === "closed")
      return (<div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}><CheckCircle2 className="w-3 h-3 text-white" /></div>);
    if (style === "in-progress" || style === "testing")
      return (<div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}><Clock className="w-2.5 h-2.5" style={{ color }} /></div>);
    if (style === "blocked" || style === "on-hold")
      return (<div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}><Pause className="w-2.5 h-2.5" style={{ color }} /></div>);
    if (style === "at-risk" || style === "update-required")
      return (<div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}><AlertTriangle className="w-2.5 h-2.5" style={{ color }} /></div>);
    return (<div className="w-[18px] h-[18px] rounded-full border-2 border-dashed flex-shrink-0" style={{ borderColor: color }} />);
  };

  const StatusBadge = ({ style, label }: { style: StatusStyle; label: string }) => {
    const group = statusGroups.find((g) => g.id === style);
    const color = group?.color || "#CCC";
    const base = "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase";
    if (style === "backlog")
      return (<span className={`${base} border ${darkMode ? "text-gray-400" : "text-[#888]"}`} style={{ borderColor: color }}><Circle className="w-3 h-3" strokeDasharray="4 2" />{label}</span>);
    return (<span className={`${base} text-white`} style={{ backgroundColor: color }}><CheckCircle2 className="w-3 h-3" />{label}</span>);
  };

  const getDueDateDisplay = (item: WorkItem) => {
    if (!item.due_date) return { text: "—", color: "text-[#999]" };
    const d = new Date(item.due_date + "T00:00:00");
    if (isToday(d)) return { text: "Today", color: "text-[#F57C00]" };
    if (isPast(d)) return { text: format(d, "M/d/yy"), color: "text-[#E53935]" };
    return { text: format(d, "M/d/yy"), color: "text-[#00897B]" };
  };

  return (
    <div className={`min-h-screen ${pageBg} font-sans transition-colors duration-300`}>
      {/* BACK + TAB BAR */}
      <div className={`flex items-center h-11 ${barBg} border-b ${barBorder} px-4 overflow-x-auto`}>
        <button
          onClick={() => navigate(projectName ? `/dashboard/${encodeURIComponent(projectName)}` : "/dashboard/spark")}
          className={`flex items-center gap-1 mr-3 px-2 py-1 rounded text-sm ${textMuted} hover:${textDark} transition-colors flex-shrink-0`}
        >
          <ArrowLeft className="w-4 h-4" />
          SPARK
        </button>
        <div className="flex items-center gap-0 flex-shrink-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={() => {
                  if (tab.id === "board") {
                    navigate(projectName ? `/dashboard/${encodeURIComponent(projectName)}/boards` : "/dashboard/spark");
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-1.5 px-5 h-11 text-sm transition-colors relative flex-shrink-0 ${isActive ? `${textDark} font-semibold` : `${textMuted} font-normal`}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
                {isActive && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${darkMode ? "bg-white" : "bg-[#1A1A1A]"}`} />}
              </button>
            );
          })}
          <button className={`flex items-center gap-1.5 px-5 h-11 text-sm ${textMutedLight} flex-shrink-0`}><Plus className="w-4 h-4" />View</button>
        </div>
        <div className="ml-auto flex items-center gap-4 flex-shrink-0">
          <button className={`flex items-center gap-1.5 text-sm ${textMuted}`}><Search className="w-4 h-4" />Search</button>
          <button className={`flex items-center gap-1.5 text-sm ${textMuted}`}><Eye className="w-4 h-4" />Hide</button>
          <button className={`flex items-center gap-1.5 text-sm ${textMuted}`}><Settings className="w-4 h-4" />Customize</button>
          <button onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}{darkMode ? "Light" : "Dark"}
          </button>
          <div className="flex items-center rounded-md overflow-hidden flex-shrink-0">
            <button className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white ${darkMode ? "bg-white/20" : "bg-[#1A1A1A]"}`}>Add Task</button>
            <button className={`px-2 py-2 text-white border-l border-white/20 ${darkMode ? "bg-white/20" : "bg-[#1A1A1A]"}`}><ChevronDown className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className={`flex items-center h-10 ${barBg} border-b ${barBorder} px-4 gap-3 overflow-x-auto`}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${pillGroupBg} ${pillGroupText}`}><Layers className="w-3.5 h-3.5" />Group: Status</span>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${pillSubBg} ${pillSubText}`}><GitBranch className="w-3.5 h-3.5" />Subtasks</span>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <button className={`flex items-center gap-1.5 text-[13px] ${textMuted}`}><Filter className="w-3.5 h-3.5" />Filter</button>
          <button className={`flex items-center gap-1.5 text-[13px] ${textMuted}`}><CheckCircle2 className="w-3.5 h-3.5" />Closed</button>
          <button className={`flex items-center gap-1.5 text-[13px] ${textMuted}`}><User className="w-3.5 h-3.5" />Assignee</button>
          <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center"><span className="text-white text-[11px] font-bold">0</span></div>
          <button onClick={() => setSprintDialogOpen(true)} className={`flex items-center gap-1.5 text-[13px] font-medium px-3 py-1 rounded-full bg-[#EDE9FF] text-[#7C3AED]`}>
            <Zap className="w-3.5 h-3.5" />Sprints
          </button>
          <input type="text" placeholder="Search..." className={`w-44 h-7 px-3 text-[13px] rounded-md border ${inputBorder} ${inputBg} ${textMuted} outline-none`} />
        </div>
      </div>

      {/* BREADCRUMB */}
      <div className={`px-4 pt-4 pb-2 ${barBg}`}>
        <p className={`text-xs ${textMutedLight} mb-1`}>BibleLand</p>
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-3 h-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          <span className={`text-lg font-bold ${textDark}`}>List</span>
          <MoreHorizontal className={`w-4 h-4 ${textMuted}`} />
        </div>
      </div>

      {/* STATUS GROUPS */}
      <div className={`${barBg} px-4 pb-8`}>
        {loading && <p className={`text-sm ${textMuted} py-4`}>Loading...</p>}
        {statusGroups.map((group) => {
          const tasks = grouped[group.id] || [];
          return (
            <div key={group.id} className="mb-2">
              <div className={`flex items-center gap-3 h-10 border-b ${barBorder}`}>
                <button onClick={() => toggleGroup(group.id)} className="flex-shrink-0">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${darkMode ? "text-gray-400" : "text-gray-600"} ${!expandedGroups[group.id] ? "-rotate-90" : ""}`} />
                </button>
                <StatusBadge style={group.id} label={group.label} />
                <span className={`text-[13px] ${textMuted}`}>{tasks.length}</span>
                <MoreHorizontal className={`w-4 h-4 ${textMuted}`} />
              <button onClick={() => { setAddingTo(group.id); setNewTitle(""); setNewAssignee(""); setNewDueDate(""); setNewPriority("none"); }} className={`flex items-center gap-1 text-[13px] ${textMuted} ml-2`}>
                  <Plus className="w-3.5 h-3.5" />Add Task
                </button>
              </div>

              {expandedGroups[group.id] && (
                <>
                  <div className={`grid grid-cols-[1fr_150px_120px_150px_120px_40px] items-center h-8 text-xs font-medium ${textMuted} border-b ${rowDivider} pl-8`}>
                    <span>Name</span><span>Assignee</span><span>Due date</span><span>Sprint</span><span>Priority</span>
                    <PlusCircle className={`w-4 h-4 ${textMuted}`} />
                  </div>

                  {tasks.map((task) => {
                    const dd = getDueDateDisplay(task);
                      return (
                        <div key={task.id} className={`grid grid-cols-[1fr_150px_120px_150px_120px_40px] items-center h-11 text-sm border-b ${rowDivider} ${rowHover} transition-colors pl-8 group/row`}>
                          <div className="flex items-center gap-2.5 min-w-0 pr-4">
                            <StatusIcon style={group.id} />
                            <span onClick={() => setSelectedTask(task)} className={`${textDark} truncate text-[14px] cursor-pointer hover:underline`}>{task.title}</span>
                            {task.description && <AlignJustify className={`w-3.5 h-3.5 flex-shrink-0 ${textMuted}`} />}
                          </div>
                          <div>
                            {(() => {
                              const member = projectMembers.find((m) => m.initials === task.assignee_initials);
                              return (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ backgroundColor: member?.team_color || "#8B5CF6" }}>
                                    <span className="text-white text-[10px] font-bold">{task.assignee_initials || "?"}</span>
                                  </div>
                                  {member && <span className={`text-[11px] ${textMuted} truncate max-w-[90px]`}>{member.full_name}</span>}
                                </div>
                              );
                            })()}
                          </div>
                          <span className={`text-[13px] ${dd.color}`}>{dd.text}</span>
                          <div>
                            {(() => {
                              const sprint = sprints.find((s) => s.id === task.sprint_id);
                              return sprint ? (
                                <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#EDE9FF] text-[#7C3AED] font-medium truncate max-w-[140px] inline-block">{sprint.name}</span>
                              ) : (
                                <span className={`text-[13px] ${textMuted}`}>—</span>
                              );
                            })()}
                          </div>
                          <Flag className="w-3.5 h-3.5 text-[#CCC]" />
                          <button onClick={() => deleteItem(task.id)} className={`${textMuted} opacity-0 group-hover/row:opacity-100 transition-opacity`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    );
                  })}

                  {addingTo === group.id ? (
                    <div className={`pl-8 py-2 border-b ${rowDivider}`}>
                      <div className="flex items-center gap-2">
                        <StatusIcon style={group.id} />
                        <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(group.id); if (e.key === "Escape") resetNewTask(); }}
                          placeholder="Task Name or type '/' for commands" className={`flex-1 h-8 px-3 text-sm rounded border ${inputBorder} ${inputBg} ${textDark} outline-none`} />
                      </div>
                      <div className="flex items-center gap-2 mt-2 ml-7">
                        {/* Assignee */}
                        <div className="flex items-center gap-1">
                          <User className={`w-3.5 h-3.5 ${textMuted}`} />
                          <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}
                            className={`h-7 px-2 text-xs rounded border ${inputBorder} ${inputBg} ${textDark} outline-none`}>
                            <option value="">Unassigned</option>
                            {projectMembers.map((m) => (
                              <option key={m.id} value={m.initials}>{m.full_name} ({m.initials})</option>
                            ))}
                          </select>
                        </div>
                        {/* Due Date */}
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3.5 h-3.5 ${textMuted}`} />
                          <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                            className={`h-7 px-2 text-xs rounded border ${inputBorder} ${inputBg} ${textDark} outline-none`} />
                        </div>
                        {/* Priority */}
                        <div className="flex items-center gap-1">
                          <Flag className={`w-3.5 h-3.5 ${textMuted}`} />
                          <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
                            className={`h-7 px-2 text-xs rounded border ${inputBorder} ${inputBg} ${textDark} outline-none`}>
                            {priorityOptions.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <button onClick={() => resetNewTask()} className={`text-xs ${textMuted}`}>Cancel</button>
                          <button onClick={() => handleAddTask(group.id)}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-[#1A1A1A] rounded">
                            Save <span className="text-[10px] opacity-60">↵</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingTo(group.id); setNewTitle(""); setNewAssignee("KN"); setNewDueDate(""); setNewPriority("none"); }}
                      className={`flex items-center gap-2 h-9 pl-8 ${textMutedLight} text-[13px] cursor-pointer ${rowHover} w-full`}>
                      <Plus className="w-3.5 h-3.5" />Add Task
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        onUpdate={updateItem}
        sprints={sprints}
        onCreateSprint={addSprint}
      />

      {/* Sprint Creation Dialog */}
      <Dialog open={sprintDialogOpen} onOpenChange={setSprintDialogOpen}>
        <DialogContent className="max-w-[400px] bg-white" aria-describedby="sprint-dialog-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <Zap className="w-4 h-4 text-[#7C3AED]" /> Create Sprint
            </DialogTitle>
          </DialogHeader>
          <p id="sprint-dialog-desc" className="text-xs text-[#999]">Define a sprint with a name and date range.</p>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-[#999] mb-1 block">Sprint Name <span className="text-red-400">*</span></label>
              <input value={sprintName} onChange={(e) => setSprintName(e.target.value)}
                placeholder="e.g. Sprint 1" className="w-full h-9 px-3 text-sm rounded-md border border-[#E0E0E0] bg-white text-[#1A1A1A] outline-none focus:border-[#7C3AED] transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#999] mb-1 block">Start Date <span className="text-red-400">*</span></label>
                <input type="date" value={sprintStart} onChange={(e) => setSprintStart(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border border-[#E0E0E0] bg-white text-[#1A1A1A] outline-none focus:border-[#7C3AED] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#999] mb-1 block">End Date <span className="text-red-400">*</span></label>
                <input type="date" value={sprintEnd} onChange={(e) => setSprintEnd(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border border-[#E0E0E0] bg-white text-[#1A1A1A] outline-none focus:border-[#7C3AED] transition-colors" />
              </div>
            </div>
            {(!sprintName.trim() || !sprintStart || !sprintEnd) && (sprintName || sprintStart || sprintEnd) && (
              <p className="text-xs text-red-400">Please fill in all fields.</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setSprintDialogOpen(false); setSprintName(""); setSprintStart(""); setSprintEnd(""); }} className="px-3 py-1.5 text-sm text-[#999] hover:text-[#333] transition-colors">Cancel</button>
              <button
                disabled={!sprintName.trim() || !sprintStart || !sprintEnd || creatingSprint}
                onClick={async () => {
                  if (!sprintName.trim() || !sprintStart || !sprintEnd) return;
                  setCreatingSprint(true);
                  const created = await addSprint({ name: sprintName.trim(), start_date: sprintStart, end_date: sprintEnd });
                  setCreatingSprint(false);
                  if (!created) return;

                  setSprintName("");
                  setSprintStart("");
                  setSprintEnd("");
                  setSprintDialogOpen(false);
                }}
                className="px-4 py-1.5 text-sm font-bold text-white bg-[#1A1A1A] rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#333] transition-colors"
              >{creatingSprint ? "Creating..." : "Create"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkItems;
