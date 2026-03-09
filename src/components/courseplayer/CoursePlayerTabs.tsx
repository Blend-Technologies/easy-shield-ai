import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Q&A", "Notes", "Announcements", "Reviews", "Learning tools"] as const;
type Tab = (typeof TABS)[number];

const CoursePlayerTabs = () => {
  const [active, setActive] = useState<Tab>("Learning tools");

  return (
    <div className="bg-card border-t border-border">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 border-b border-border overflow-x-auto">
        <button className="p-3 text-muted-foreground hover:text-foreground">
          <Search className="h-4 w-4" />
        </button>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={cn(
              "px-4 py-3 text-sm whitespace-nowrap transition-colors border-b-2",
              active === tab
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-8 py-6 min-h-[120px]">
        {active === "Learning tools" && (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Learning reminders</h3>
            <p className="text-sm text-muted-foreground">
              Set up push notifications or calendar events to stay on track for your learning goals.
            </p>
            <Button className="mt-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Add a learning reminder
            </Button>
          </div>
        )}
        {active === "Overview" && (
          <p className="text-sm text-muted-foreground">Course overview and description will appear here.</p>
        )}
        {active === "Q&A" && (
          <p className="text-sm text-muted-foreground">Questions and answers from students.</p>
        )}
        {active === "Notes" && (
          <p className="text-sm text-muted-foreground">Your personal notes for this course.</p>
        )}
        {active === "Announcements" && (
          <p className="text-sm text-muted-foreground">Instructor announcements will appear here.</p>
        )}
        {active === "Reviews" && (
          <p className="text-sm text-muted-foreground">Course reviews from students.</p>
        )}
      </div>
    </div>
  );
};

export default CoursePlayerTabs;
