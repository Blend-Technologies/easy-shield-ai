import { useMemo } from "react";
import { WorkItem } from "@/hooks/useWorkItems";
import { CheckCircle2 } from "lucide-react";

type Props = {
  workItems: WorkItem[];
};

const CompletedThisWeek = ({ workItems }: Props) => {
  const completedItems = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return workItems.filter((item) => {
      if (item.status !== "complete" && item.status !== "shipped" && item.status !== "closed") return false;
      const updated = new Date(item.updated_at);
      return updated >= startOfWeek;
    });
  }, [workItems]);

  return (
    <div className="border rounded-lg p-4 flex flex-col" style={{ borderColor: "#E5E5E5" }}>
      <h3 className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>Tasks Completed This Week</h3>
      {completedItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <span className="text-sm" style={{ color: "#AAAAAA" }}>No Results</span>
        </div>
      ) : (
        <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto">
          <div className="text-center mb-2">
            <span className="text-4xl font-bold" style={{ color: "#00BFA5" }}>{completedItems.length}</span>
            <p className="text-xs mt-1" style={{ color: "#999" }}>tasks completed</p>
          </div>
          {completedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate" style={{ color: "#555" }}>{item.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedThisWeek;
