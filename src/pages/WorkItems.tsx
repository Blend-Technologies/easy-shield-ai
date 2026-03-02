import { useState } from "react";
import {
  ChevronDown,
  Plus,
  RotateCcw,
  Wrench,
  ArrowUp,
  Trash2,
  SlidersHorizontal,
  Filter,
  Maximize2,
  Sun,
  Moon,
  Search,
  Eye,
  Settings,
  LayoutGrid,
  List,
  Columns3,
  BarChart3,
  Table,
  Activity,
  Layers,
  GitBranch,
  CheckCircle2,
  Circle,
  Clock,
  MoreHorizontal,
  Flag,
  PlusCircle,
  AlignJustify,
  User,
} from "lucide-react";

type Task = {
  id: string;
  name: string;
  hasDescription?: boolean;
  assignee: string;
  dueDate: string;
  dueDateColor: "green" | "red" | "orange";
  dueDateLabel?: string;
};

type StatusGroup = {
  id: string;
  label: string;
  badgeStyle: "shipped" | "testing" | "backlog";
  tasks: Task[];
};

const mockData: StatusGroup[] = [
  {
    id: "shipped",
    label: "SHIPPED",
    badgeStyle: "shipped",
    tasks: [
      { id: "1", name: 'Come up with ideas for morning and midday meditation in the page "/family-time"', assignee: "KN", dueDate: "1/20/26", dueDateColor: "green" },
      { id: "2", name: "Add more bedtime stories", hasDescription: true, assignee: "KN", dueDate: "1/16/26", dueDateColor: "green" },
      { id: "3", name: "Test all the buttons", assignee: "KN", dueDate: "1/12/26", dueDateColor: "green" },
    ],
  },
  {
    id: "testing",
    label: "TESTING",
    badgeStyle: "testing",
    tasks: [
      { id: "4", name: "test again all buttons", assignee: "KN", dueDate: "1/27/26", dueDateColor: "red" },
    ],
  },
  {
    id: "backlog",
    label: "BACKLOG",
    badgeStyle: "backlog",
    tasks: [
      { id: "5", name: 'REmove the game "The garden of Eden"', assignee: "KN", dueDate: "Today", dueDateColor: "orange", dueDateLabel: "Today" },
    ],
  },
];

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: BarChart3 },
  { id: "table", label: "Table", icon: Table },
  { id: "workload", label: "Workload", icon: Activity },
];

const WorkItems = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    shipped: true,
    testing: true,
    backlog: true,
  });

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

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

  const StatusIcon = ({ style }: { style: "shipped" | "testing" | "backlog" }) => {
    if (style === "shipped")
      return (
        <div className="w-[18px] h-[18px] rounded-full bg-[#00BFA5] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      );
    if (style === "testing")
      return (
        <div className="w-[18px] h-[18px] rounded-full border-2 border-[#8B6347] flex items-center justify-center flex-shrink-0">
          <Clock className="w-2.5 h-2.5 text-[#8B6347]" />
        </div>
      );
    return (
      <div className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-[#CCC] flex-shrink-0" />
    );
  };

  const StatusBadge = ({ style, label }: { style: "shipped" | "testing" | "backlog"; label: string }) => {
    const base = "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase";
    if (style === "shipped")
      return (
        <span className={`${base} bg-[#00BFA5] text-white`}>
          <CheckCircle2 className="w-3 h-3" />
          {label}
        </span>
      );
    if (style === "testing")
      return (
        <span className={`${base} bg-[#8B6347] text-white`}>
          <Clock className="w-3 h-3" />
          {label}
        </span>
      );
    return (
      <span className={`${base} border border-[#CCC] ${darkMode ? "text-gray-400" : "text-[#888]"}`}>
        <Circle className="w-3 h-3" strokeDasharray="4 2" />
        {label}
      </span>
    );
  };

  const dueDateColorMap = {
    green: "text-[#00897B]",
    red: "text-[#E53935]",
    orange: "text-[#F57C00]",
  };

  return (
    <div className={`min-h-screen ${pageBg} font-sans transition-colors duration-300`}>
      {/* SECTION 1 — TAB BAR */}
      <div className={`flex items-center h-11 ${barBg} border-b ${barBorder} px-4 overflow-x-auto`}>
        <div className="flex items-center gap-0 flex-shrink-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 h-11 text-sm transition-colors relative flex-shrink-0 ${
                  isActive
                    ? `${textDark} font-semibold`
                    : `${textMuted} font-normal hover:${textDark}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${darkMode ? "bg-white" : "bg-[#1A1A1A]"}`} />
                )}
              </button>
            );
          })}
          <button className={`flex items-center gap-1.5 px-5 h-11 text-sm ${textMutedLight} hover:${textMuted} flex-shrink-0`}>
            <Plus className="w-4 h-4" />
            View
          </button>
        </div>

        <div className="ml-auto flex items-center gap-4 flex-shrink-0">
          <button className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
            <Search className="w-4 h-4" />
            Search
          </button>
          <button className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
            <Eye className="w-4 h-4" />
            Hide
          </button>
          <button className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
            <Settings className="w-4 h-4" />
            Customize
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {darkMode ? "Light" : "Dark"}
          </button>

          {/* Add Task CTA */}
          <div className="flex items-center rounded-md overflow-hidden flex-shrink-0">
            <button className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white ${darkMode ? "bg-white/20" : "bg-[#1A1A1A]"}`}>
              Add Task
            </button>
            <button className={`px-2 py-2 text-white border-l border-white/20 ${darkMode ? "bg-white/20" : "bg-[#1A1A1A]"}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2 — FILTER ROW */}
      <div className={`flex items-center h-10 ${barBg} border-b ${barBorder} px-4 gap-3 overflow-x-auto`}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${pillGroupBg} ${pillGroupText}`}>
            <Layers className="w-3.5 h-3.5" />
            Group: Status
          </span>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${pillSubBg} ${pillSubText}`}>
            <GitBranch className="w-3.5 h-3.5" />
            Subtasks
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <button className={`flex items-center gap-1.5 text-[13px] ${textMuted}`}>
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className={`flex items-center gap-1.5 text-[13px] ${textMuted}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Closed
          </button>
          <button className={`flex items-center gap-1.5 text-[13px] ${textMuted}`}>
            <User className="w-3.5 h-3.5" />
            Assignee
          </button>
          <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">0</span>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className={`w-44 h-7 px-3 text-[13px] rounded-md border ${inputBorder} ${inputBg} ${textMuted} placeholder:${textMuted} outline-none`}
          />
        </div>
      </div>

      {/* SECTION 3 — BREADCRUMB + LIST HEADER */}
      <div className={`px-4 pt-4 pb-2 ${barBg}`}>
        <p className={`text-xs ${textMutedLight} mb-1`}>BibleLand</p>
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-3 h-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          <span className={`text-lg font-bold ${textDark}`}>List</span>
          <MoreHorizontal className={`w-4 h-4 ${textMuted}`} />
        </div>
      </div>

      {/* SECTION 4 — STATUS GROUPS */}
      <div className={`${barBg} px-4 pb-8`}>
        {mockData.map((group) => (
          <div key={group.id} className="mb-2">
            {/* Group Header */}
            <div className={`flex items-center gap-3 h-10 border-b ${barBorder}`}>
              <button onClick={() => toggleGroup(group.id)} className="flex-shrink-0">
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${darkMode ? "text-gray-400" : "text-gray-600"} ${
                    !expandedGroups[group.id] ? "-rotate-90" : ""
                  }`}
                />
              </button>
              <StatusBadge style={group.badgeStyle} label={group.label} />
              <span className={`text-[13px] ${textMuted}`}>{group.tasks.length}</span>
              <MoreHorizontal className={`w-4 h-4 ${textMuted}`} />
              <button className={`flex items-center gap-1 text-[13px] ${textMuted} ml-2`}>
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>

            {expandedGroups[group.id] && (
              <>
                {/* Column Headers */}
                <div className={`grid grid-cols-[1fr_150px_120px_120px_40px] items-center h-8 text-xs font-medium ${textMuted} border-b ${rowDivider} pl-8`}>
                  <span>Name</span>
                  <span>Assignee</span>
                  <span>Due date</span>
                  <span>Priority</span>
                  <PlusCircle className={`w-4 h-4 ${textMuted}`} />
                </div>

                {/* Task Rows */}
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`grid grid-cols-[1fr_150px_120px_120px_40px] items-center h-11 text-sm border-b ${rowDivider} ${rowHover} transition-colors pl-8 group/row`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                      <StatusIcon style={group.badgeStyle} />
                      <span className={`${textDark} truncate text-[14px]`}>{task.name}</span>
                      {task.hasDescription && <AlignJustify className={`w-3.5 h-3.5 flex-shrink-0 ${textMuted}`} />}
                    </div>
                    <div>
                      <div className="w-[26px] h-[26px] rounded-full bg-[#8B5CF6] flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{task.assignee}</span>
                      </div>
                    </div>
                    <span className={`text-[13px] ${dueDateColorMap[task.dueDateColor]}`}>
                      {task.dueDateLabel || task.dueDate}
                    </span>
                    <Flag className="w-3.5 h-3.5 text-[#CCC]" />
                    <MoreHorizontal className={`w-4 h-4 ${textMuted} opacity-0 group-hover/row:opacity-100 transition-opacity`} />
                  </div>
                ))}

                {/* Add Task row */}
                <div className={`flex items-center gap-2 h-9 pl-8 ${textMutedLight} text-[13px] cursor-pointer ${rowHover}`}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkItems;
