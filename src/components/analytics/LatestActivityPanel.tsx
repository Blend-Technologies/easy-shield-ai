type ActivityItem = {
  id: string;
  action: string;
  description: string;
  created_at: string;
};

type Props = {
  activity: ActivityItem[];
};

const LatestActivityPanel = ({ activity }: Props) => {
  const recentActivity = activity.slice(0, 10);

  return (
    <div className="border rounded-lg" style={{ borderColor: "#E5E5E5" }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: "#E5E5E5" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Latest Activity</h3>
      </div>

      <div className="px-4 pt-3">
        {recentActivity.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "#AAAAAA" }}>No recent activity</p>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: "#999" }}>Recent</p>
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #00BFA5, #4169E1)" }}
                  />
                  <span className="text-xs flex-1" style={{ color: "#555" }}>{a.description}</span>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "#999" }}>
                    {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LatestActivityPanel;
