const activities = [
  { text: "You edited the task description", time: "7:42 am" },
  { text: "You created this task", time: "7:28 am" },
  { text: "You assigned to KOFFI Amani Narcisse", time: "7:28 am" },
];

const LatestActivityPanel = () => (
  <div className="border rounded-lg relative" style={{ borderColor: "#E5E5E5" }}>
    <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E5E5" }}>
      <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Latest Activity</h3>
    </div>

    <div className="px-4 pt-3">
      <p className="text-xs mb-3" style={{ color: "#999" }}>Today</p>

      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 rounded inline-block" style={{ backgroundColor: "#333" }} />
        <span className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>Social Media Postings</span>
      </div>

      <div className="space-y-2">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #00BFA5, #4169E1)" }} />
            <span className="text-xs flex-1" style={{ color: "#555" }}>{a.text}</span>
            <span className="text-[11px] flex-shrink-0" style={{ color: "#999" }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Upsell */}
    <div className="px-4 py-3 mt-4 border-t" style={{ borderColor: "#F0F0F0" }}>
      <p className="text-[11px] mb-2" style={{ color: "#999" }}>Only the last 24 hours of activity is available on your current plan</p>
      <p className="text-base font-bold" style={{ color: "#1A1A1A" }}>Upgrade to Unlimited to unlock 7 days of Activity</p>
      <p className="text-xs mt-1" style={{ color: "#555" }}><strong>Unlimited</strong> — Full activity history and more</p>
    </div>

    {/* Badge */}
    <div
      className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-[8px] font-bold text-center leading-tight"
      style={{ backgroundColor: "#FFD700", color: "#1A1A1A" }}
    >
      100%<br />Money<br />Back
    </div>
  </div>
);

export default LatestActivityPanel;
