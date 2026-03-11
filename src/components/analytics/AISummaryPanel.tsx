import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { WorkItem } from "@/hooks/useWorkItems";
import { Sprint } from "@/hooks/useSprints";

type Props = {
  workItems: WorkItem[];
  sprints: Sprint[];
};

const Chip = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5"
    style={{ backgroundColor: color }}
  >
    {children}
  </span>
);

const AISummaryPanel = ({ workItems, sprints }: Props) => {
  const summary = useMemo(() => {
    const total = workItems.length;
    const completed = workItems.filter((i) => i.status === "complete" || i.status === "shipped" || i.status === "closed").length;
    const inProgress = workItems.filter((i) => i.status === "in-progress").length;
    const blocked = workItems.filter((i) => i.status === "blocked" || i.status === "at-risk").length;
    const today = new Date().toISOString().split("T")[0];
    const overdue = workItems.filter((i) => i.due_date && i.due_date < today && i.status !== "complete" && i.status !== "shipped" && i.status !== "closed");
    const activeSprints = sprints.filter((s) => s.start_date <= today && s.end_date >= today);

    return { total, completed, inProgress, blocked, overdue, activeSprints };
  }, [workItems, sprints]);

  if (workItems.length === 0) {
    return (
      <div className="border rounded-lg p-4" style={{ borderColor: "#E5E5E5" }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "#8B5CF6" }} />
          <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>AI Executive Summary</span>
        </div>
        <p className="text-[13px]" style={{ color: "#999" }}>
          No work items found. Create work items and sprints to see project insights here.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 max-h-[380px] overflow-y-auto" style={{ borderColor: "#E5E5E5" }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: "#8B5CF6" }} />
        <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>AI Executive Summary</span>
      </div>

      <p className="text-[13px] leading-relaxed" style={{ color: "#444" }}>
        The project has <Chip color="#E8F5E9">✅ {summary.completed} completed</Chip> out of{" "}
        <strong>{summary.total}</strong> total work items.{" "}
        {summary.inProgress > 0 && (
          <>Currently <Chip color="#E3F2FD">🔵 {summary.inProgress} in progress</Chip>. </>
        )}
        {summary.blocked > 0 && (
          <>
            <Chip color="#FFF3E0">🔶 {summary.blocked} items</Chip> are blocked or at risk and need attention.{" "}
          </>
        )}
        {summary.overdue.length > 0 && (
          <>
            <Chip color="#FFEBEE">🔴 {summary.overdue.length} overdue</Chip> items require immediate action.
          </>
        )}
      </p>

      {summary.overdue.length > 0 && (
        <>
          <h3 className="text-[13px] font-bold mt-4 mb-2" style={{ color: "#1A1A1A" }}>Overdue Items</h3>
          <ul className="text-[13px] space-y-1.5" style={{ color: "#444" }}>
            {summary.overdue.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#E53935" }} />
                {item.title}
                <span className="text-[11px] ml-auto" style={{ color: "#999" }}>
                  Due: {new Date(item.due_date!).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {summary.activeSprints.length > 0 && (
        <>
          <h3 className="text-[13px] font-bold mt-4 mb-2" style={{ color: "#1A1A1A" }}>Active Sprints</h3>
          <ul className="text-[13px] space-y-1.5" style={{ color: "#444" }}>
            {summary.activeSprints.map((sprint) => (
              <li key={sprint.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#2196F3" }} />
                {sprint.name}
                <span className="text-[11px] ml-auto" style={{ color: "#999" }}>
                  {new Date(sprint.start_date).toLocaleDateString()} – {new Date(sprint.end_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default AISummaryPanel;
