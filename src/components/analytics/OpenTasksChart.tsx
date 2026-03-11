import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { WorkItem } from "@/hooks/useWorkItems";

const COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#10B981", "#F97316", "#EF4444", "#3B82F6"];

type Props = {
  workItems: WorkItem[];
};

const OpenTasksChart = ({ workItems }: Props) => {
  const data = useMemo(() => {
    const openItems = workItems.filter(
      (i) => i.status !== "complete" && i.status !== "shipped" && i.status !== "closed"
    );
    const grouped: Record<string, number> = {};
    openItems.forEach((item) => {
      const key = item.assignee_initials || "Unassigned";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, tasks], i) => ({
      name,
      tasks,
      color: name === "Unassigned" ? "#9E9E9E" : COLORS[i % COLORS.length],
    }));
  }, [workItems]);

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-4" style={{ borderColor: "#E5E5E5" }}>
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A1A" }}>Open Tasks by Assignee</h3>
        <div className="flex items-center justify-center min-h-[220px] text-sm" style={{ color: "#AAAAAA" }}>
          No open tasks
        </div>
      </div>
    );
  }

  const maxTasks = Math.max(...data.map((d) => d.tasks), 1);

  return (
    <div className="border rounded-lg p-4" style={{ borderColor: "#E5E5E5" }}>
      <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A1A" }}>Open Tasks by Assignee</h3>
      <div className="flex justify-center">
        <BarChart width={220} height={220} data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#555" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={(v) => (v.length > 12 ? v.slice(0, 12) + "…" : v)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#999" }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxTasks * 1.2)]}
            label={{ value: "Tasks", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#999" } }}
          />
          <Bar dataKey="tasks" radius={[4, 4, 0, 0]} barSize={60}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </div>
  );
};

export default OpenTasksChart;
