const stats = [
  { label: "Unassigned", value: 2 },
  { label: "In Progress", value: 1 },
  { label: "Completed", value: 3 },
];

const segments = [
  { color: "#9E9E9E", width: "60%" },
  { color: "#8B6347", width: "10%" },
  { color: "#00BFA5", width: "30%" },
];

const StatsWorkloadPanel = () => (
  <div className="border rounded-lg" style={{ borderColor: "#E5E5E5" }}>
    {/* Stat tiles */}
    <div className="grid grid-cols-3 divide-x" style={{ borderColor: "#F0F0F0" }}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center py-6">
          <span className="text-xs" style={{ color: "#999" }}>{s.label}</span>
          <span className="text-5xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{s.value}</span>
          <span className="text-[11px] mt-1" style={{ color: "#999" }}>tasks</span>
        </div>
      ))}
    </div>

    {/* Workload bar */}
    <div className="border-t p-4" style={{ borderColor: "#F0F0F0" }}>
      <h3 className="text-[13px] font-semibold mb-3" style={{ color: "#1A1A1A" }}>Workload by Status</h3>
      <div className="flex h-4 rounded overflow-hidden">
        {segments.map((seg, i) => (
          <div key={i} style={{ backgroundColor: seg.color, width: seg.width }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className="text-[10px]" style={{ color: "#999" }}>{i * 10}</span>
        ))}
      </div>
      <p className="text-center text-[11px] mt-1" style={{ color: "#999" }}>Tasks</p>
    </div>
  </div>
);

export default StatsWorkloadPanel;
