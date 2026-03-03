import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

const data = [
  { name: "KOFFI Amani Narcisse", tasks: 8, color: "#8B5CF6" },
  { name: "Unassigned", tasks: 3, color: "#9E9E9E" },
];

const OpenTasksChart = () => (
  <div className="border rounded-lg p-4" style={{ borderColor: "#E5E5E5" }}>
    <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A1A" }}>Open Tasks by Assignee</h3>
    <div className="flex justify-center">
      <BarChart width={220} height={220} data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#555" }} tickLine={false} axisLine={false} interval={0}
          tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + "…" : v} />
        <YAxis tick={{ fontSize: 10, fill: "#999" }} tickLine={false} axisLine={false} domain={[0, 10]}
          label={{ value: "Tasks", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#999" } }} />
        <Bar dataKey="tasks" radius={[4, 4, 0, 0]} barSize={60}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </div>
  </div>
);

export default OpenTasksChart;
