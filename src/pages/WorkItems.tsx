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
} from "lucide-react";

const WorkItems = () => {
  const [darkMode, setDarkMode] = useState(true);

  const bg = darkMode ? "bg-[#0D1F3C]" : "bg-white";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-[#E0E0E0]" : "text-gray-600";
  const iconAccent = darkMode ? "text-[#89CFF0]" : "text-[#4A90D9]";
  const dividerColor = darkMode ? "border-white/10" : "border-gray-200";

  return (
    <div className={`min-h-screen ${bg} font-sans transition-colors duration-300`}>
      {/* Top bar with toggle */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <h1 className={`text-[22px] font-normal ${textPrimary}`}>
          Work items
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            darkMode
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>

      {/* Action toolbar */}
      <div className={`flex items-center gap-1 px-6 py-2 border-b ${dividerColor}`}>
        {/* Recently updated dropdown */}
        <button
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm ${
            darkMode
              ? "bg-white/5 text-white hover:bg-white/10"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } transition-colors`}
        >
          Recently updated
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>

        {/* + New Work Item split button */}
        <div className="flex items-center rounded ml-3">
          <button
            className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 rounded-l text-sm text-white transition-colors"
            style={{ backgroundColor: "#5A4E38" }}
          >
            <Plus className="w-4 h-4" />
            New Work Item
          </button>
          <button
            className="px-2 py-2 rounded-r text-white transition-colors border-l border-white/20"
            style={{ backgroundColor: "#4A3F2F" }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ghost action buttons */}
        <div className="flex items-center gap-5 ml-5">
          <button className={`flex items-center gap-1.5 text-sm ${textSecondary} hover:${textPrimary} transition-colors`}>
            <RotateCcw className="w-4 h-4" />
            Open in Queries
          </button>
          <button className={`flex items-center gap-1.5 text-sm ${textSecondary} hover:${textPrimary} transition-colors`}>
            <Wrench className="w-4 h-4" />
            Column Options
          </button>
          <button className={`flex items-center gap-1.5 text-sm ${textSecondary} hover:${textPrimary} transition-colors`}>
            <ArrowUp className="w-4 h-4" />
            Import Work Items
          </button>
          <button className={`flex items-center gap-1.5 text-sm ${textSecondary} hover:${textPrimary} transition-colors`}>
            <Trash2 className="w-4 h-4" />
            Recycle Bin
          </button>
        </div>

        {/* Right-side icon buttons */}
        <div className="ml-auto flex items-center gap-3">
          <button className={`${iconAccent} hover:opacity-80 transition-opacity`}>
            <SlidersHorizontal className="w-[18px] h-[18px]" />
          </button>
          <button className={`${iconAccent} hover:opacity-80 transition-opacity`}>
            <Filter className="w-[18px] h-[18px]" />
          </button>
          <button className={`${iconAccent} hover:opacity-80 transition-opacity`}>
            <Maximize2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className={`grid grid-cols-[40px_1fr_140px_140px_140px_140px] items-center px-6 py-2.5 border-b ${dividerColor} text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
        <div />
        <div>Title</div>
        <div>State</div>
        <div>Assigned To</div>
        <div>Type</div>
        <div>Changed Date</div>
      </div>

      {/* Empty state */}
      <div className={`flex flex-col items-center justify-center py-24 ${textSecondary}`}>
        <p className="text-sm">No work items found. Click "+ New Work Item" to create one.</p>
      </div>
    </div>
  );
};

export default WorkItems;
