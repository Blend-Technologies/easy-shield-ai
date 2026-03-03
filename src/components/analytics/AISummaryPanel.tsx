import { Sparkles } from "lucide-react";

const Chip = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5"
    style={{ backgroundColor: color }}
  >
    {children}
  </span>
);

const AISummaryPanel = () => (
  <div className="border rounded-lg p-4 max-h-[380px] overflow-y-auto" style={{ borderColor: "#E5E5E5" }}>
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-4 h-4" style={{ color: "#8B5CF6" }} />
      <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>AI Executive Summary</span>
    </div>

    <p className="text-[13px] leading-relaxed" style={{ color: "#444" }}>
      The project <Chip color="#E8F5E9">✅ Test all the buttons</Chip> is marked as shipped, but a similar task,
      <Chip color="#FFF3E0">🔶 test again all buttons</Chip>, is still in the testing phase, indicating potential delays.
      Additionally, tasks such as <Chip color="#F5F5F5">on the creation swipe game...</Chip> and
      <Chip color="#F5F5F5">REmove the game...</Chip> are in the backlog, with due dates already passed, suggesting
      they may be off track.
    </p>

    <h3 className="text-[13px] font-bold mt-4 mb-2" style={{ color: "#1A1A1A" }}>Key Efforts & Initiatives</h3>
    <ul className="text-[13px] space-y-2" style={{ color: "#444" }}>
      <li>
        <strong>• Enhance Family Time Content:</strong> Add engaging content for family activities and bedtime stories.
        <ul className="ml-5 mt-1 space-y-1">
          <li className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#9E9E9E" }} />
            Add more bedtime stories
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#00BFA5" }} />
            Create a personalized story about "The Temptation and Fall of Man" in '/family-time/bedtime'
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#00BFA5" }} />
            Come up with ideas for morning and midday meditation in '/family-time'
          </li>
        </ul>
      </li>
      <li>
        <strong>• Improve Game Features:</strong> Enhance game interactions and navigation...
      </li>
    </ul>
  </div>
);

export default AISummaryPanel;
