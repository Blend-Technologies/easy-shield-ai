import { useMemo } from "react";
import { ChevronDown, Plus, MoreHorizontal, Flag, Circle, Filter } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkItem } from "@/hooks/useWorkItems";
import { Sprint } from "@/hooks/useSprints";

type Props = {
  workItems: WorkItem[];
  sprints: Sprint[];
};

const priorityColor = (p: string) => {
  switch (p) {
    case "urgent": return "#E53935";
    case "high": return "#F57C00";
    case "normal": return "#2196F3";
    case "low": return "#9E9E9E";
    default: return "#CCC";
  }
};

const TasksDuePanel = ({ workItems, sprints }: Props) => {
  const today = new Date().toISOString().split("T")[0];

  const { overdue, dueToday, dueThisWeek } = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

    const openItems = workItems.filter(
      (i) => i.status !== "complete" && i.status !== "shipped" && i.status !== "closed" && i.due_date
    );

    return {
      overdue: openItems.filter((i) => i.due_date! < today),
      dueToday: openItems.filter((i) => i.due_date === today),
      dueThisWeek: openItems.filter((i) => i.due_date! > today && i.due_date! <= endOfWeekStr),
    };
  }, [workItems, today]);

  const getSprintName = (sprintId: string | null) => {
    if (!sprintId) return null;
    return sprints.find((s) => s.id === sprintId)?.name || null;
  };

  const renderRow = (item: WorkItem) => (
    <div key={item.id} className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors border-b" style={{ borderColor: "#F5F5F5" }}>
      <Circle className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: "#CCC" }} strokeDasharray="4 2" />
      <div className="flex-1 min-w-0">
        {getSprintName(item.sprint_id) && (
          <p className="text-[11px]" style={{ color: "#999" }}>{getSprintName(item.sprint_id)}</p>
        )}
        <p className="text-sm truncate" style={{ color: "#1A1A1A" }}>{item.title}</p>
      </div>
      <div className="w-20 flex justify-center">
        {item.assignee_initials && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: "#8B5CF6" }}>
              {item.assignee_initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <span className="w-20 text-center text-xs font-medium" style={{ color: item.due_date! < today ? "#E53935" : "#F57C00" }}>
        {item.due_date === today ? "Today" : new Date(item.due_date!).toLocaleDateString()}
      </span>
      <span className="w-16 flex justify-center">
        <Flag className="w-3.5 h-3.5" style={{ color: priorityColor(item.priority) }} />
      </span>
    </div>
  );

  const totalCount = overdue.length + dueToday.length + dueThisWeek.length;

  return (
    <div className="border rounded-lg" style={{ borderColor: "#E5E5E5" }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E5E5" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Tasks Due This Week or Overdue</h3>
      </div>

      <div className="px-4 py-2 flex items-center justify-between border-b text-xs" style={{ borderColor: "#F0F0F0" }}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: "#F3E8FF", color: "#8B5CF6" }}>Group: Due date</span>
        </div>
        <span className="text-[11px]" style={{ color: "#999" }}>{totalCount} items</span>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {totalCount === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "#AAAAAA" }}>
            No tasks due this week or overdue
          </div>
        )}

        {overdue.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#F0F0F0" }}>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "#999" }} />
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>OVERDUE</span>
              <span className="text-[11px]" style={{ color: "#999" }}>{overdue.length}</span>
            </div>
            <div className="flex items-center px-4 py-1.5 text-[11px] border-b" style={{ color: "#999", borderColor: "#F0F0F0" }}>
              <span className="flex-1">Name</span>
              <span className="w-20 text-center">Assignee</span>
              <span className="w-20 text-center">Due date</span>
              <span className="w-16 text-center">Priority</span>
            </div>
            {overdue.map(renderRow)}
          </>
        )}

        {dueToday.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#F0F0F0" }}>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "#999" }} />
              <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>Today</span>
              <span className="text-[11px]" style={{ color: "#999" }}>{dueToday.length}</span>
            </div>
            {dueToday.map(renderRow)}
          </>
        )}

        {dueThisWeek.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#F0F0F0" }}>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "#999" }} />
              <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>This Week</span>
              <span className="text-[11px]" style={{ color: "#999" }}>{dueThisWeek.length}</span>
            </div>
            {dueThisWeek.map(renderRow)}
          </>
        )}
      </div>
    </div>
  );
};

export default TasksDuePanel;
