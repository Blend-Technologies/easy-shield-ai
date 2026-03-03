import { ChevronDown, Plus, MoreHorizontal, Flag, Circle, Filter } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TasksDuePanel = () => (
  <div className="border rounded-lg" style={{ borderColor: "#E5E5E5" }}>
    {/* Header */}
    <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E5E5" }}>
      <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Tasks Due This Week or Overdue</h3>
    </div>

    {/* Sub toolbar */}
    <div className="px-4 py-2 flex items-center justify-between border-b text-xs" style={{ borderColor: "#F0F0F0" }}>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: "#F3E8FF", color: "#8B5CF6" }}>Group: Due date</span>
        <span className="px-2 py-0.5 rounded text-[11px]" style={{ backgroundColor: "#F5F5F5", color: "#666" }}>Subtasks</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px]" style={{ backgroundColor: "#E3F0FF", color: "#2196F3" }}>
          <Filter className="w-3 h-3" /> 2 Filters
        </span>
        <span style={{ color: "#999" }}>Closed</span>
        <span style={{ color: "#999" }}>Search...</span>
        <span style={{ color: "#999" }}>Customize</span>
      </div>
    </div>

    {/* List content */}
    <div className="max-h-[320px] overflow-y-auto">
      {/* OVERDUE group */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#F0F0F0" }}>
        <ChevronDown className="w-3.5 h-3.5" style={{ color: "#999" }} />
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>OVERDUE</span>
        <span className="text-[11px]" style={{ color: "#999" }}>1</span>
        <div className="flex-1" />
        <MoreHorizontal className="w-3.5 h-3.5" style={{ color: "#999" }} />
        <button className="flex items-center gap-1 text-[11px]" style={{ color: "#999" }}>
          <Plus className="w-3 h-3" /> Add Task
        </button>
      </div>

      {/* Column header */}
      <div className="flex items-center px-4 py-1.5 text-[11px] border-b" style={{ color: "#999", borderColor: "#F0F0F0" }}>
        <span className="flex-1">Name</span>
        <span className="w-20 text-center">Assignee</span>
        <span className="w-20 text-center">Due date ↑</span>
        <span className="w-16 text-center">Priority</span>
        <Plus className="w-3 h-3" />
      </div>

      {/* Overdue task */}
      <div className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors border-b" style={{ borderColor: "#F5F5F5" }}>
        <Circle className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: "#CCC" }} strokeDasharray="4 2" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px]" style={{ color: "#999" }}>BibleLand · List</p>
          <p className="text-sm truncate" style={{ color: "#1A1A1A" }}>test again all buttons</p>
        </div>
        <div className="w-20 flex justify-center">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: "#8B5CF6" }}>KN</AvatarFallback></Avatar>
        </div>
        <span className="w-20 text-center text-xs font-medium" style={{ color: "#E53935" }}>1/27/26</span>
        <span className="w-16 flex justify-center"><Flag className="w-3.5 h-3.5" style={{ color: "#CCC" }} /></span>
        <MoreHorizontal className="w-3.5 h-3.5" style={{ color: "#CCC" }} />
      </div>

      {/* TODAY group */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#F0F0F0" }}>
        <ChevronDown className="w-3.5 h-3.5" style={{ color: "#999" }} />
        <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>Today</span>
        <span className="text-[11px]" style={{ color: "#999" }}>4</span>
        <div className="flex-1" />
        <button className="flex items-center gap-1 text-[11px]" style={{ color: "#999" }}>
          <Plus className="w-3 h-3" /> Add Task
        </button>
      </div>

      {/* Today tasks */}
      {[
        "REmove the game 'The garden of Eden'",
        "Use this link to create more bible games: https://poki.com/en/g/fruit-ninja?msockid=306e100a...",
      ].map((title, i) => (
        <div key={i} className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors border-b" style={{ borderColor: "#F5F5F5" }}>
          <Circle className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: "#CCC" }} strokeDasharray="4 2" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px]" style={{ color: "#999" }}>BibleLand · List</p>
            <p className="text-sm truncate" style={{ color: "#1A1A1A" }}>{title}</p>
          </div>
          <div className="w-20 flex justify-center">
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: "#8B5CF6" }}>KN</AvatarFallback></Avatar>
          </div>
          <span className="w-20 text-center text-xs font-medium" style={{ color: "#F57C00" }}>Today</span>
          <span className="w-16 flex justify-center"><Flag className="w-3.5 h-3.5" style={{ color: "#CCC" }} /></span>
          <MoreHorizontal className="w-3.5 h-3.5" style={{ color: "#CCC" }} />
        </div>
      ))}

      {/* Add task row */}
      <div className="px-4 py-2 text-[12px]" style={{ color: "#999" }}>
        <button className="flex items-center gap-1"><Plus className="w-3 h-3" /> Add Task</button>
      </div>
    </div>
  </div>
);

export default TasksDuePanel;
