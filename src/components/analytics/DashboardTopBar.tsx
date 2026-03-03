import { LayoutGrid, Star, Calendar, Share2, Download, MoreHorizontal } from "lucide-react";

const DashboardTopBar = () => (
  <div className="flex items-center justify-between px-4 h-10 border-b" style={{ borderColor: "#EEEEEE" }}>
    <div className="flex items-center gap-2">
      <LayoutGrid className="w-3.5 h-3.5" style={{ color: "#888" }} />
      <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Dashboard</span>
      <Star className="w-3 h-3" style={{ color: "#888" }} />
    </div>
    <div className="flex items-center gap-4">
      <button className="flex items-center gap-1.5 text-xs" style={{ color: "#888" }}>
        <Calendar className="w-3.5 h-3.5" /> Schedule report
      </button>
      <button className="flex items-center gap-1.5 text-xs" style={{ color: "#888" }}>
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>
      <button style={{ color: "#888" }}><Download className="w-3.5 h-3.5" /></button>
      <button style={{ color: "#888" }}><MoreHorizontal className="w-3.5 h-3.5" /></button>
    </div>
  </div>
);

export default DashboardTopBar;
