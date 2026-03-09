import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StepId =
  | "intended-learners"
  | "course-structure"
  | "setup-test-video"
  | "film-edit"
  | "curriculum"
  | "captions"
  | "accessibility"
  | "landing-page"
  | "pricing"
  | "promotions"
  | "course-messages";

export interface StepItem {
  id: StepId;
  label: string;
  optional?: boolean;
  completed: boolean;
}

interface Section {
  title: string;
  items: StepItem[];
}

interface Props {
  sections: Section[];
  activeStep: StepId;
  onStepClick: (id: StepId) => void;
  allRequiredDone: boolean;
}

const CourseBuilderSidebar = ({ sections, activeStep, onStepClick, allRequiredDone }: Props) => (
  <aside className="w-[280px] shrink-0 border-r border-border bg-card flex flex-col h-full">
    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
      {sections.map((sec) => (
        <div key={sec.title}>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            {sec.title}
          </h3>
          <div className="space-y-0.5">
            {sec.items.map((item) => {
              const active = item.id === activeStep;
              return (
                <button
                  key={item.id}
                  onClick={() => onStepClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                    active
                      ? "border-l-[3px] border-primary bg-primary/5 text-foreground font-medium"
                      : "border-l-[3px] border-transparent hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span>
                    {item.label}
                    {item.optional && (
                      <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>

    <div className="p-4 border-t border-border">
      <Button
        type="button"
        disabled={!allRequiredDone}
        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold"
      >
        Submit for Review
      </Button>
    </div>
  </aside>
);

export default CourseBuilderSidebar;
