import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { ProjectMember } from "@/hooks/useProjectMembers";
import { WorkItem } from "@/hooks/useWorkItems";

const COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#10B981", "#F97316", "#EF4444", "#3B82F6", "#9E9E9E"];

type Props = {
  members?: ProjectMember[];
  workItems: WorkItem[];
};

const TasksByAssigneeChart = ({ members = [], workItems }: Props) => {
  const data = useMemo(() => {
    if (workItems.length === 0) {
      return [{ name: "No tasks", value: 100, color: "#9E9E9E" }];
    }

    const grouped: Record<string, number> = {};
    workItems.forEach((item) => {
      const key = item.assignee_initials || "Unassigned";
      grouped[key] = (grouped[key] || 0) + 1;
    });

    const total = workItems.length;
    return Object.entries(grouped).map(([name, count], i) => ({
      name,
      value: Math.round((count / total) * 100),
      color: name === "Unassigned" ? "#9E9E9E" : COLORS[i % COLORS.length],
    }));
  }, [workItems]);

  return (
    <div className="border rounded-lg p-4" style={{ borderColor: "#E5E5E5" }}>
      <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A1A" }}>Total Tasks by Assignee</h3>
      <div className="flex justify-center">
        <PieChart width={220} height={220}>
          <Pie data={data} cx={110} cy={100} innerRadius={50} outerRadius={85} dataKey="value" strokeWidth={0}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </div>
      <div className="space-y-1.5 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]" style={{ color: "#555" }}>
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
            {d.name} {d.value}%
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksByAssigneeChart;
