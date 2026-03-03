import { useState } from "react";
import { RefreshCw, Clock, SlidersHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const DashboardEditBar = () => {
  const [editMode, setEditMode] = useState(true);

  return (
    <div className="flex items-center justify-between px-4 h-9 border-b" style={{ borderColor: "#F0F0F0" }}>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "#333" }}>Edit mode</span>
        <Switch checked={editMode} onCheckedChange={setEditMode} className="h-[18px] w-9 data-[state=checked]:bg-[#4169E1]" />
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-xs" style={{ color: "#999" }}>
          <RefreshCw className="w-3 h-3" /> Refreshed just now
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: "#999" }}>
          <Clock className="w-3 h-3" /> Auto refresh: On
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: "#999" }}>
          <SlidersHorizontal className="w-3 h-3" /> Filters
        </span>
        <button className="text-xs text-white px-3.5 py-1.5 rounded-md" style={{ backgroundColor: "#1A1A1A" }}>
          Add card
        </button>
      </div>
    </div>
  );
};

export default DashboardEditBar;
