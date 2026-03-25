import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  List, Columns3, Calendar, BarChart3, Users, Plus, Search, Eye, Settings,
  ChevronDown, Layers, GitBranch, Filter, CheckCircle2, User, ArrowLeft,
  Circle, Clock, AlertTriangle, RefreshCw, Pause, Flag, Tag, MoreHorizontal,
  Zap,
} from "lucide-react";
import { useSprints } from "@/hooks/useSprints";
import { useWorkItems, WorkItem } from "@/hooks/useWorkItems";
import { useProjectIdFromName } from "@/hooks/useProjectIdFromName";
import { useProjectMembers } from "@/hooks/useProjectMembers";

const viewTabs = [
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "gantt", label: "Gantt", icon: BarChart3 },
  { id: "team", label: "Team", icon: Users },
];

type ColumnDef = {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  pillBg: string | null;
  columnBg: string;
  statusKey: string; // maps to work_items.status
};

const columnDefs: ColumnDef[] = [
  { id: "backlog", label: "BACKLOG", icon: Circle, iconColor: "#AAAAAA", pillBg: null, columnBg: "#FFFFFF", statusKey: "backlog" },
  { id: "in-progress", label: "IN PROGRESS", icon: RefreshCw, iconColor: "#FFFFFF", pillBg: "#7C3AED", columnBg: "#FDFAFF", statusKey: "in-progress" },
  { id: "testing", label: "TESTING", icon: CheckCircle2, iconColor: "#FFFFFF", pillBg: "#2563EB", columnBg: "#F5F8FF", statusKey: "testing" },
  { id: "at-risk", label: "AT RISK", icon: AlertTriangle, iconColor: "#FFFFFF", pillBg: "#F57C00", columnBg: "#FFFAF5", statusKey: "at-risk" },
  { id: "blocked", label: "BLOCKED", icon: Pause, iconColor: "#FFFFFF", pillBg: "#DC2626", columnBg: "#FFF5F5", statusKey: "blocked" },
  { id: "update-required", label: "UPDATE REQUIRED", icon: RefreshCw, iconColor: "#FFFFFF", pillBg: "#F59E0B", columnBg: "#FFFEF5", statusKey: "update-required" },
  { id: "on-hold", label: "ON HOLD", icon: Pause, iconColor: "#FFFFFF", pillBg: "#78350F", columnBg: "#FDFAF8", statusKey: "on-hold" },
  { id: "complete", label: "COMPLETE", icon: CheckCircle2, iconColor: "#FFFFFF", pillBg: "#00BFA5", columnBg: "#F5FFFD", statusKey: "complete" },
  { id: "closed", label: "CLOSED", icon: Circle, iconColor: "#FFFFFF", pillBg: "#6B7280", columnBg: "#F9FAFB", statusKey: "closed" },
];

const KanbanBoard = () => {
  const navigate = useNavigate();
  const { projectName } = useParams();
  const projectId = useProjectIdFromName(projectName);
  const { members: projectMembers } = useProjectMembers(projectId);
  const { sprints } = useSprints(projectId);
  const { items, addItem, updateItem } = useWorkItems(projectId);

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [draggedTask, setDraggedTask] = useState<{ statusKey: string; taskId: string; sprintId: string | null } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [collapsedSprints, setCollapsedSprints] = useState<Set<string>>(new Set());

  // Build a sprint lookup map
  const sprintMap = useMemo(() => {
    const map = new Map<string, string>();
    sprints.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sprints]);

  const toggleSprintCollapse = (key: string) => {
    setCollapsedSprints((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAddTask = async (statusKey: string) => {
    if (!newTitle.trim()) return;
    await addItem({
      title: newTitle.trim(),
      status: statusKey,
      sprint_id: selectedSprintId || undefined,
    });
    setNewTitle("");
    setSelectedSprintId("");
    setAddingTo(null);
  };

  const handleDragStart = (e: React.DragEvent, statusKey: string, taskId: string, sprintId: string | null) => {
    const payload = JSON.stringify({ statusKey, taskId, sprintId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-kanban-task", payload);
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTask({ statusKey, taskId, sprintId });
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatusKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);

    let source = draggedTask;
    const payload = e.dataTransfer.getData("application/x-kanban-task");
    if (payload) {
      try {
        source = JSON.parse(payload) as { statusKey: string; taskId: string; sprintId: string | null };
      } catch {
        // Keep state fallback
      }
    }

    if (!source || source.statusKey === targetStatusKey) {
      setDraggedTask(null);
      return;
    }

    await updateItem(source.taskId, { status: targetStatusKey });
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* TOP TAB BAR */}
      <div className="flex items-center h-11 bg-white border-b border-[#E5E5E5] px-4 flex-shrink-0">
        <button
          onClick={() => navigate("/dashboard/spark")}
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
          {columnDefs.map((col) => {
            const Icon = col.icon;
            const hasPill = !!col.pillBg;
            const colTasks = items.filter((item) => item.status === col.statusKey);

            // Group tasks by sprint
            const ungrouped = colTasks.filter((t) => !t.sprint_id);
            const sprintGroups = new Map<string, { name: string; tasks: WorkItem[] }>();
            colTasks.forEach((t) => {
              if (t.sprint_id) {
                const sprintName = sprintMap.get(t.sprint_id) || "Unknown Sprint";
                if (!sprintGroups.has(t.sprint_id)) sprintGroups.set(t.sprint_id, { name: sprintName, tasks: [] });
                sprintGroups.get(t.sprint_id)!.tasks.push(t);
              }
            });

            return (
              <div
                key={col.id}
                className={`min-w-[230px] w-[230px] flex-shrink-0 rounded-lg border p-3 flex flex-col transition-colors ${dragOverColumn === col.id ? "border-[#7C3AED] bg-[#F5F0FF]" : "border-[#EEEEEE]"}`}
                style={{ backgroundColor: dragOverColumn === col.id ? undefined : col.columnBg }}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.statusKey)}
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
                      <Icon className="w-4 h-4" style={{ color: col.iconColor }} />
                      <span className="text-[12px] font-bold uppercase text-[#555]">{col.label}</span>
                    </>
                  )}
                  <span className="text-[12px] text-[#999]">{colTasks.length}</span>
                  <div className="ml-auto flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-3.5 h-3.5 text-[#999]" />
                    <Plus className="w-3.5 h-3.5 text-[#999]" />
                  </div>
                </div>

                {/* Task Cards - grouped by sprint */}
                <div className="flex-1 space-y-2">
                  {/* Sprint groups */}
                  {Array.from(sprintGroups.entries()).map(([sprintId, group]) => {
                    const collapseKey = `${col.id}-${sprintId}`;
                    const isCollapsed = collapsedSprints.has(collapseKey);
                    return (
                      <div
                        key={sprintId}
                        className="rounded-lg border border-[#D8D0F0] bg-[#F9F7FF] overflow-hidden"
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDrop={(e) => handleDrop(e, col.statusKey)}
                      >
                        <button
                          onClick={() => toggleSprintCollapse(collapseKey)}
                          className="flex items-center gap-2 w-full px-2.5 py-2 text-left hover:bg-[#F0ECFF] transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 text-[#7C3AED] transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                          <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
                          <span className="text-[12px] font-bold text-[#7C3AED] truncate">{group.name}</span>
                          <span className="text-[11px] text-[#A78BFA] ml-auto">{group.tasks.length}</span>
                        </button>
                        {!isCollapsed && (
                          <div className="px-1.5 pb-1.5 space-y-1.5">
                            {group.tasks.map((task) => (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, col.statusKey, task.id, task.sprint_id)}
                                onDragEnd={() => { setDraggedTask(null); setDragOverColumn(null); }}
                                onDragOver={(e) => handleDragOver(e, col.id)}
                                onDrop={(e) => handleDrop(e, col.statusKey)}
                                className="bg-white border border-[#E5E5E5] rounded-md p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:border-[#D0D0D0] transition-all cursor-grab active:cursor-grabbing select-none"
                              >
                                <p className="text-[13px] font-medium text-[#1A1A1A] leading-snug line-clamp-2 mb-2">{task.title}</p>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const member = projectMembers.find((m) => m.initials === task.assignee_initials);
                                    return member ? (
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: member.team_color }}>
                                        <span className="text-white text-[8px] font-bold">{member.initials}</span>
                                      </div>
                                    ) : <User className="w-[14px] h-[14px] text-[#AAAAAA]" />;
                                  })()}
                                  <Calendar className="w-[14px] h-[14px] text-[#AAAAAA]" />
                                  <Flag className="w-[14px] h-[14px] text-[#AAAAAA]" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Ungrouped tasks */}
                  {ungrouped.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, col.statusKey, task.id, task.sprint_id)}
                      onDragEnd={() => { setDraggedTask(null); setDragOverColumn(null); }}
                      onDragOver={(e) => handleDragOver(e, col.id)}
                      onDrop={(e) => handleDrop(e, col.statusKey)}
                      className="bg-white border border-[#E5E5E5] rounded-lg p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:border-[#D0D0D0] transition-all cursor-grab active:cursor-grabbing select-none"
                    >
                      <p className="text-[14px] font-medium text-[#1A1A1A] leading-snug line-clamp-2 mb-3">{task.title}</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const member = projectMembers.find((m) => m.initials === task.assignee_initials);
                          return member ? (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: member.team_color }}>
                              <span className="text-white text-[8px] font-bold">{member.initials}</span>
                            </div>
                          ) : <User className="w-[15px] h-[15px] text-[#AAAAAA]" />;
                        })()}
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
                        if (e.key === "Enter") handleAddTask(col.statusKey);
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
                        onClick={() => handleAddTask(col.statusKey)}
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
