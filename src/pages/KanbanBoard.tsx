import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  List, Columns3, Calendar, BarChart3, Users, Plus, Search, Eye, Settings,
  ChevronDown, Layers, GitBranch, Filter, CheckCircle2, User, ArrowLeft,
  Circle, Clock, AlertTriangle, RefreshCw, Pause, Flag, Tag, MoreHorizontal,
  Zap,
} from "lucide-react";
import { useSprints } from "@/hooks/useSprints";

const viewTabs = [
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "gantt", label: "Gantt", icon: BarChart3 },
  { id: "team", label: "Team", icon: Users },
];

type KanbanColumn = {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  pillBg: string | null;
  columnBg: string;
  tasks: { id: string; title: string; sprintId?: string; sprintName?: string }[];
};

const initialColumns: KanbanColumn[] = [
  {
    id: "backlog", label: "BACKLOG", icon: Circle, iconColor: "#AAAAAA",
    pillBg: null, columnBg: "#FFFFFF",
    tasks: [{ id: "1", title: "Entry level jobs are going away" }],
  },
  {
    id: "in-progress", label: "IN PROGRESS", icon: RefreshCw, iconColor: "#FFFFFF",
    pillBg: "#7C3AED", columnBg: "#FDFAFF", tasks: [],
  },
  {
    id: "testing", label: "TESTING", icon: CheckCircle2, iconColor: "#FFFFFF",
    pillBg: "#2563EB", columnBg: "#F5F8FF", tasks: [],
  },
  {
    id: "at-risk", label: "AT RISK", icon: AlertTriangle, iconColor: "#FFFFFF",
    pillBg: "#F57C00", columnBg: "#FFFAF5", tasks: [],
  },
  {
    id: "blocked", label: "BLOCKED", icon: Pause, iconColor: "#FFFFFF",
    pillBg: "#DC2626", columnBg: "#FFF5F5", tasks: [],
  },
  {
    id: "update-required", label: "UPDATE REQUIRED", icon: RefreshCw, iconColor: "#FFFFFF",
    pillBg: "#F59E0B", columnBg: "#FFFEF5", tasks: [],
  },
  {
    id: "on-hold", label: "ON HOLD", icon: Pause, iconColor: "#FFFFFF",
    pillBg: "#78350F", columnBg: "#FDFAF8", tasks: [],
  },
  {
    id: "complete", label: "COMPLETE", icon: CheckCircle2, iconColor: "#FFFFFF",
    pillBg: "#00BFA5", columnBg: "#F5FFFD", tasks: [],
  },
  {
    id: "closed", label: "CLOSED", icon: Circle, iconColor: "#FFFFFF",
    pillBg: "#6B7280", columnBg: "#F9FAFB", tasks: [],
  },
];

const KanbanBoard = () => {
  const navigate = useNavigate();
  const { projectName } = useParams();
  const { sprints } = useSprints();
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [draggedTask, setDraggedTask] = useState<{ colId: string; taskId: string } | null>(null);

  const handleAddTask = (colId: string) => {
    if (!newTitle.trim()) return;
    const sprint = sprints.find((s) => s.id === selectedSprintId);
    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId
          ? { ...col, tasks: [...col.tasks, { id: crypto.randomUUID(), title: newTitle.trim(), sprintId: sprint?.id, sprintName: sprint?.name }] }
          : col
      )
    );
    setNewTitle("");
    setSelectedSprintId("");
    setAddingTo(null);
  };

  const handleDragStart = (colId: string, taskId: string) => {
    setDraggedTask({ colId, taskId });
  };

  const handleDrop = (targetColId: string) => {
    if (!draggedTask || draggedTask.colId === targetColId) {
      setDraggedTask(null);
      return;
    }
    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === draggedTask.colId);
      const task = sourceCol?.tasks.find((t) => t.id === draggedTask.taskId);
      if (!task) return prev;
      return prev.map((col) => {
        if (col.id === draggedTask.colId) return { ...col, tasks: col.tasks.filter((t) => t.id !== draggedTask.taskId) };
        if (col.id === targetColId) return { ...col, tasks: [...col.tasks, task] };
        return col;
      });
    });
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* TOP TAB BAR */}
      <div className="flex items-center h-11 bg-white border-b border-[#E5E5E5] px-4 flex-shrink-0">
        <button
          onClick={() => navigate(projectName ? `/dashboard/${encodeURIComponent(projectName)}` : "/dashboard/spark")}
          className="flex items-center gap-1 mr-3 px-2 py-1 rounded text-sm text-[#999] hover:text-[#1A1A1A] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          SPARK
        </button>
        <div className="flex items-center gap-0 flex-shrink-0">
          {viewTabs.map((tab) => {
            const isActive = tab.id === "board";
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "list") navigate(projectName ? `/dashboard/${encodeURIComponent(projectName)}/work-items` : "/dashboard/spark");
                }}
                className={`flex items-center gap-1.5 px-5 h-11 text-sm transition-colors relative flex-shrink-0 ${
                  isActive ? "text-[#1A1A1A] font-bold" : "text-[#888] font-normal"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />}
              </button>
            );
          })}
          <button className="flex items-center gap-1.5 px-5 h-11 text-sm text-[#AAA] flex-shrink-0">
            <Plus className="w-4 h-4" />View
          </button>
        </div>
        <div className="ml-auto flex items-center gap-4 flex-shrink-0">
          <button className="flex items-center gap-1.5 text-sm text-[#888]"><Search className="w-4 h-4" />Search</button>
          <button className="flex items-center gap-1.5 text-sm text-[#888]"><Eye className="w-4 h-4" />Hide</button>
          <button className="flex items-center gap-1.5 text-sm text-[#888]"><Settings className="w-4 h-4" />Customize</button>
          <div className="flex items-center rounded-md overflow-hidden flex-shrink-0">
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#1A1A1A]">Add Task</button>
            <button className="px-2 py-2 text-white border-l border-white/20 bg-[#1A1A1A]">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex items-center h-10 bg-white border-b border-[#EEEEEE] px-4 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-[#EDE9FF] text-[#7C3AED]">
            <Layers className="w-3.5 h-3.5" />Group: Status
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-[#F0F0F0] text-[#555]">
            <GitBranch className="w-3.5 h-3.5" />Subtasks
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <button className="flex items-center gap-1.5 text-[13px] text-[#888]">
            <ArrowLeft className="w-3.5 h-3.5 rotate-90" />Sort
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-[#888]">
            <Filter className="w-3.5 h-3.5" />Filter
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-[#888]">
            <CheckCircle2 className="w-3.5 h-3.5" />Closed
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-[#888]">
            <User className="w-3.5 h-3.5" />Assignee
          </button>
          <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">0</span>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-40 h-7 px-3 text-[13px] rounded-md border border-[#E0E0E0] bg-white text-[#999] outline-none"
          />
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto bg-[#F7F7F8] p-4">
        <div className="flex gap-3 h-full min-h-[calc(100vh-7.5rem)]">
          {columns.map((col) => {
            const Icon = col.icon;
            const hasPill = !!col.pillBg;
            return (
              <div
                key={col.id}
                className="min-w-[230px] w-[230px] flex-shrink-0 rounded-lg border border-[#EEEEEE] p-3 flex flex-col"
                style={{ backgroundColor: col.columnBg }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3">
                  {hasPill ? (
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase text-white"
                      style={{ backgroundColor: col.pillBg! }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {col.label}
                    </span>
                  ) : (
                    <>
                      <Icon className="w-4 h-4" style={{ color: col.iconColor }} strokeDasharray={col.id === "todo" ? "4 2" : undefined} />
                      <span className="text-[12px] font-bold uppercase text-[#555]">{col.label}</span>
                    </>
                  )}
                  <span className="text-[12px] text-[#999]">{col.tasks.length}</span>
                  <div className="ml-auto flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-3.5 h-3.5 text-[#999]" />
                    <Plus className="w-3.5 h-3.5 text-[#999]" />
                  </div>
                </div>

                {/* Task Cards */}
                <div className="flex-1 space-y-2">
                  {col.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(col.id, task.id)}
                      className="bg-white border border-[#E5E5E5] rounded-lg p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:border-[#D0D0D0] transition-all cursor-grab active:cursor-grabbing"
                    >
                      <p className="text-[14px] font-medium text-[#1A1A1A] leading-snug line-clamp-2 mb-2">
                        {task.title}
                      </p>
                      {task.sprintName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EDE9FF] text-[#7C3AED] mb-2">
                          <Zap className="w-3 h-3" />{task.sprintName}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <User className="w-[15px] h-[15px] text-[#AAAAAA]" />
                        <Calendar className="w-[15px] h-[15px] text-[#AAAAAA]" />
                        <Flag className="w-[15px] h-[15px] text-[#AAAAAA]" />
                        <Tag className="w-[15px] h-[15px] text-[#AAAAAA]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Task */}
                {addingTo === col.id ? (
                  <div className="mt-2 space-y-1.5">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTask(col.id);
                        if (e.key === "Escape") { setAddingTo(null); setNewTitle(""); setSelectedSprintId(""); }
                      }}
                      placeholder="Task name..."
                      className="w-full h-8 px-3 text-sm rounded-md border border-[#E0E0E0] bg-white text-[#1A1A1A] outline-none"
                    />
                    <select
                      value={selectedSprintId}
                      onChange={(e) => setSelectedSprintId(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-md border border-[#E0E0E0] bg-white text-[#555] outline-none"
                    >
                      <option value="">No sprint</option>
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddTask(col.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-[#1A1A1A] rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setAddingTo(null); setNewTitle(""); setSelectedSprintId(""); }}
                        className="text-xs text-[#999]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingTo(col.id); setNewTitle(""); }}
                    className="flex items-center gap-1.5 w-full mt-2 py-1.5 rounded-md text-[13px] text-[#AAAAAA] hover:bg-[#F0F0F0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
