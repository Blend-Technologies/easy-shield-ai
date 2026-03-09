import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import CourseBuilderSidebar, { type StepId } from "@/components/community/CourseBuilderSidebar";
import IntendedLearnersStep from "@/components/community/coursebuilder/IntendedLearnersStep";
import CurriculumStep from "@/components/community/coursebuilder/CurriculumStep";

const DEFAULT_OBJECTIVES = [
  "Understand the concepts of AI Agents",
  "Understand how to use Semantic Kernel in combination with Azure AI Agents",
  "Create Azure AI with Single Agents",
  "Create Azure AI with Multiple Agents",
  "Using FastAPI to build AI Agent Endpoints",
  "Create an Enterprise Full Stack AI Agent Application with FastAPI and Next.JS",
  "Deploying your Multi-Agent application in Azure with Azure Web Apps",
  "Monitor and Trace your AI Agents",
  "",
];

const makeSections = (completed: Record<StepId, boolean>) => [
  {
    title: "Plan your course",
    items: [
      { id: "intended-learners" as StepId, label: "Intended learners", completed: completed["intended-learners"] },
    ],
  },
  {
    title: "Create your content",
    items: [
      { id: "curriculum" as StepId, label: "Curriculum", completed: completed["curriculum"] },
      { id: "captions" as StepId, label: "Captions", optional: true, completed: completed["captions"] },
      { id: "accessibility" as StepId, label: "Accessibility", optional: true, completed: completed["accessibility"] },
    ],
  },
  {
    title: "Publish your course",
    items: [
      { id: "landing-page" as StepId, label: "Course landing page", completed: completed["landing-page"] },
      { id: "pricing" as StepId, label: "Pricing", completed: completed["pricing"] },
      { id: "promotions" as StepId, label: "Promotions", completed: completed["promotions"] },
      { id: "course-messages" as StepId, label: "Course messages", completed: completed["course-messages"] },
    ],
  },
];

const INITIAL_COMPLETED: Record<StepId, boolean> = {
  "intended-learners": true,
  "course-structure": true,
  "setup-test-video": true,
  "film-edit": true,
  curriculum: false,
  captions: false,
  accessibility: true,
  "landing-page": false,
  pricing: false,
  promotions: true,
  "course-messages": false,
};

const REQUIRED_STEPS: StepId[] = [
  "intended-learners",
  "curriculum",
  "landing-page",
  "pricing",
  "course-messages",
];

const PlaceholderStep = ({ label }: { label: string }) => (
  <div className="max-w-3xl">
    <h1 className="text-2xl font-bold text-foreground">{label}</h1>
    <div className="border-b border-border my-4" />
    <p className="text-muted-foreground text-sm">This step is coming soon.</p>
  </div>
);

const CourseBuilder = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useIsAdmin();
  const [activeStep, setActiveStep] = useState<StepId>("intended-learners");
  const [completed, setCompleted] = useState(INITIAL_COMPLETED);
  const [objectives, setObjectives] = useState(DEFAULT_OBJECTIVES);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/community/hub", { replace: true });
  }, [loading, isAdmin, navigate]);

  if (loading) return null;
  if (!isAdmin) return null;

  const sections = makeSections(completed);
  const allRequiredDone = REQUIRED_STEPS.every((s) => completed[s]);

  const activeLabel =
    sections.flatMap((s) => s.items).find((i) => i.id === activeStep)?.label ?? "";

  const renderStep = () => {
    switch (activeStep) {
      case "intended-learners":
        return <IntendedLearnersStep objectives={objectives} onChange={setObjectives} />;
      case "curriculum":
        return <CurriculumStep />;
      default:
        return <PlaceholderStep label={activeLabel} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Top bar */}
      <header className="h-14 shrink-0 bg-foreground flex items-center px-4 gap-4">
        <button
          onClick={() => navigate("/community/hub")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-background text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </button>

        <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
          <span className="text-background font-semibold text-sm truncate max-w-md">
            Building AI Agents in Azure with SK | Azure AI Agents | Next.JS
          </span>
          <Badge variant="secondary" className="bg-muted-foreground/20 text-muted-foreground text-[10px] uppercase tracking-wider shrink-0">
            Draft
          </Badge>
          <span className="text-muted-foreground text-xs shrink-0 hidden md:inline">
            39min of video content uploaded
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-muted-foreground/30 hover:bg-muted-foreground/40 text-background border-0 rounded-full px-5"
          >
            Save
          </Button>
          <button className="text-muted-foreground hover:text-background">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <CourseBuilderSidebar
          sections={sections}
          activeStep={activeStep}
          onStepClick={setActiveStep}
          allRequiredDone={allRequiredDone}
        />

        <main className="flex-1 overflow-y-auto p-8">
          {renderStep()}
        </main>
      </div>
    </div>
  );
};

export default CourseBuilder;
