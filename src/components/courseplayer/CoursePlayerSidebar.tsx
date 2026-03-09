import { useState } from "react";
import { ChevronUp, ChevronDown, Sparkles, X, Columns2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section } from "@/pages/CoursePlayer";

interface Props {
  sections: Section[];
  currentLectureId: string;
  onSelectLecture: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onClose: () => void;
}

const CoursePlayerSidebar = ({
  sections,
  currentLectureId,
  onSelectLecture,
  onToggleComplete,
  onClose,
}: Props) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ s3: true });
  const [activeTab, setActiveTab] = useState<"content" | "ai">("content");

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const sectionProgress = (sec: Section) => {
    const done = sec.lectures.filter((l) => l.completed).length;
    return `${done} / ${sec.lectures.length}`;
  };

  return (
    <aside className="w-[320px] shrink-0 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center border-b border-border px-4 h-11 shrink-0">
        <button
          onClick={() => setActiveTab("content")}
          className={cn(
            "text-sm font-medium px-1 py-2 border-b-2 mr-4",
            activeTab === "content"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Course content
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={cn(
            "text-sm font-medium px-1 py-2 border-b-2 flex items-center gap-1",
            activeTab === "ai"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Assistant
        </button>
        <div className="flex-1" />
        <button className="text-muted-foreground hover:text-foreground p-1">
          <Columns2 className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 ml-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "content" ? (
          sections.map((sec) => {
            const open = !!expandedSections[sec.id];
            return (
              <div key={sec.id} className="border-b border-border">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">{sec.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {sectionProgress(sec)} | {sec.totalDuration}
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Lectures */}
                {open && (
                  <div>
                    {sec.lectures.map((lec) => {
                      const isCurrent = lec.id === currentLectureId;
                      return (
                        <div
                          key={lec.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                            isCurrent ? "bg-muted/70" : "hover:bg-muted/30"
                          )}
                          onClick={() => onSelectLecture(lec.id)}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(lec.id);
                            }}
                            className={cn(
                              "mt-0.5 w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors",
                              lec.completed
                                ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                                : "border-muted-foreground/40"
                            )}
                          >
                            {lec.completed && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className={cn(
                              "text-sm leading-snug",
                              isCurrent ? "text-foreground font-medium" : "text-foreground/80"
                            )}>
                              {lec.number > 0 ? `${lec.number}. ` : ""}{lec.title}
                            </div>
                            {lec.duration && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                <Play className="h-3 w-3" />
                                {lec.duration}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-6 text-sm text-muted-foreground text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-[#7C3AED]" />
            <p className="font-medium text-foreground mb-1">AI Assistant</p>
            <p>Ask questions about the course content and get instant answers.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CoursePlayerSidebar;
