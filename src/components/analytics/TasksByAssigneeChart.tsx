import { PieChart, Pie, Cell } from "recharts";
import { ProjectMember } from "@/hooks/useProjectMembers";

const COLORS = ["#8B5CF6", "#06B6D4", "#EC4899", "#10B981", "#F97316", "#EF4444", "#3B82F6", "#9E9E9E"];

type Props = {
  members?: ProjectMember[];
};

const TasksByAssigneeChart = ({ members = [] }: Props) => {
  const data = members.length > 0
    ? [
        ...members.map((m, i) => ({ name: m.full_name, value: Math.round(100 / (members.length + 1)), color: COLORS[i % COLORS.length] })),
        { name: "Unassigned", value: Math.round(100 / (members.length + 1)), color: "#9E9E9E" },
      ]
    : [
        { name: "No team members", value: 100, color: "#9E9E9E" },
      ];

  return (
    <div className="border rounded-lg p-4" style={{ borderColor: "#E5E5E5" }}>
      <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A1A" }}>Total Tasks by Assignee</h3>
      <div className="flex justify-center">
        <PieChart width={220} height={220}>
          <Pie data={data} cx={110} cy={100} innerRadius={50} outerRadius={85} dataKey="value" strokeWidth={0}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
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
