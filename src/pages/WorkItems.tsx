import { useState } from "react";
import {
  ChevronDown, Plus, Search, Eye, Settings, LayoutGrid, List,
  Columns3, BarChart3, Table, Activity, Layers, GitBranch,
  CheckCircle2, Circle, Clock, MoreHorizontal, Flag, PlusCircle,
  AlignJustify, User, Filter, Sun, Moon, Trash2,
} from "lucide-react";
import { useWorkItems, WorkItem } from "@/hooks/useWorkItems";
import { format, isToday, isPast } from "date-fns";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: BarChart3 },
  { id: "table", label: "Table", icon: Table },
  { id: "workload", label: "Workload", icon: Activity },
];

type StatusStyle = "shipped" | "testing" | "backlog";

const statusGroups: { id: StatusStyle; label: string }[] = [
  { id: "shipped", label: "DONE" },
  { id: "testing", label: "IN PROGRESS" },
  { id: "backlog", label: "BACKLOG" },
];

const WorkItems = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    shipped: true, testing: true, backlog: true,
  });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("KN");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("none");
  const { grouped, loading, addItem, deleteItem } = useWorkItems();

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const resetNewTask = () => {
    setNewTitle("");
    setNewAssignee("KN");
    setNewDueDate("");
    setNewPriority("none");
    setAddingTo(null);
  };

  const handleAddTask = async (status: string) => {
    if (!newTitle.trim()) return;
    await addItem({
      title: newTitle.trim(),
      status,
      assignee_initials: newAssignee || "KN",
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
    if (style === "shipped")
      return (<div className="w-[18px] h-[18px] rounded-full bg-[#00BFA5] flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-3 h-3 text-white" /></div>);
    if (style === "testing")
      return (<div className="w-[18px] h-[18px] rounded-full border-2 border-[#8B6347] flex items-center justify-center flex-shrink-0"><Clock className="w-2.5 h-2.5 text-[#8B6347]" /></div>);
    return (<div className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-[#CCC] flex-shrink-0" />);
  };

  const StatusBadge = ({ style, label }: { style: StatusStyle; label: string }) => {
    const base = "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase";
    if (style === "shipped") return (<span className={`${base} bg-[#00BFA5] text-white`}><CheckCircle2 className="w-3 h-3" />{label}</span>);
    if (style === "testing") return (<span className={`${base} bg-[#8B6347] text-white`}><Clock className="w-3 h-3" />{label}</span>);
    return (<span className={`${base} border border-[#CCC] ${darkMode ? "text-gray-400" : "text-[#888]"}`}><Circle className="w-3 h-3" strokeDasharray="4 2" />{label}</span>);
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
      {/* TAB BAR */}
      <div className={`flex items-center h-11 ${barBg} border-b ${barBorder} px-4 overflow-x-auto`}>
        <div className="flex items-center gap-0 flex-shrink-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
                <button onClick={() => { setAddingTo(group.id); setNewTitle(""); setNewAssignee("KN"); setNewDueDate(""); setNewPriority("none"); }} className={`flex items-center gap-1 text-[13px] ${textMuted} ml-2`}>
                  <Plus className="w-3.5 h-3.5" />Add Task
                </button>
              </div>

              {expandedGroups[group.id] && (
                <>
                  <div className={`grid grid-cols-[1fr_150px_120px_120px_40px] items-center h-8 text-xs font-medium ${textMuted} border-b ${rowDivider} pl-8`}>
                    <span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span>
                    <PlusCircle className={`w-4 h-4 ${textMuted}`} />
                  </div>

                  {tasks.map((task) => {
                    const dd = getDueDateDisplay(task);
                    return (
                      <div key={task.id} className={`grid grid-cols-[1fr_150px_120px_120px_40px] items-center h-11 text-sm border-b ${rowDivider} ${rowHover} transition-colors pl-8 group/row`}>
                        <div className="flex items-center gap-2.5 min-w-0 pr-4">
                          <StatusIcon style={group.id} />
                          <span className={`${textDark} truncate text-[14px]`}>{task.title}</span>
                          {task.description && <AlignJustify className={`w-3.5 h-3.5 flex-shrink-0 ${textMuted}`} />}
                        </div>
                        <div>
                          <div className="w-[26px] h-[26px] rounded-full bg-[#8B5CF6] flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">{task.assignee_initials || "?"}</span>
                          </div>
                        </div>
                        <span className={`text-[13px] ${dd.color}`}>{dd.text}</span>
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
                          <input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value.toUpperCase().slice(0, 3))}
                            placeholder="Initials" className={`w-14 h-7 px-2 text-xs rounded border ${inputBorder} ${inputBg} ${textDark} outline-none text-center`} />
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
    </div>
  );
};

export default WorkItems;
