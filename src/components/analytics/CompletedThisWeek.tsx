const CompletedThisWeek = () => (
  <div className="border rounded-lg p-4 flex flex-col" style={{ borderColor: "#E5E5E5" }}>
    <h3 className="text-[13px] font-semibold" style={{ color: "#1A1A1A" }}>Tasks Completed This Week</h3>
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <span className="text-sm" style={{ color: "#AAAAAA" }}>No Results</span>
    </div>
  </div>
);

export default CompletedThisWeek;
