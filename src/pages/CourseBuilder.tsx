import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CourseBuilderSidebar, { type StepId } from "@/components/community/CourseBuilderSidebar";
import IntendedLearnersStep from "@/components/community/coursebuilder/IntendedLearnersStep";
import CurriculumStep from "@/components/community/coursebuilder/CurriculumStep";

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
  "intended-learners": false,
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
  const { courseId } = useParams<{ courseId: string }>();
  const { isAdmin, loading } = useIsAdmin();
  const [activeStep, setActiveStep] = useState<StepId>("intended-learners");
  const [completed, setCompleted] = useState(INITIAL_COMPLETED);

  // Course data from DB
  const [courseTitle, setCourseTitle] = useState("Untitled Course");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [savingObjectives, setSavingObjectives] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  // Load course data
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();
    if (error || !data) return;
    setCourseTitle(data.title);
    // Load objectives from DB
    const obj = (data as any).objectives;
    if (Array.isArray(obj) && obj.length > 0) {
      setObjectives(obj as string[]);
      setCompleted((prev) => ({ ...prev, "intended-learners": true }));
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/community/hub", { replace: true });
  }, [loading, isAdmin, navigate]);

  // Save objectives to DB
  const handleObjectivesChange = useCallback(
    async (newObjectives: string[]) => {
      setObjectives(newObjectives);
      if (!courseId) return;

      // Mark completed if at least 4 non-empty objectives
      const filled = newObjectives.filter((o) => o.trim().length > 0);
      setCompleted((prev) => ({ ...prev, "intended-learners": filled.length >= 4 }));

      // Debounced save
      setSavingObjectives(true);
      const { error } = await supabase
        .from("courses")
        .update({ objectives: newObjectives } as any)
        .eq("id", courseId);
      setSavingObjectives(false);
      if (error) {
        toast({ title: "Error saving objectives", description: error.message, variant: "destructive" });
      }
    },
    [courseId]
  );

  // Save course title
  const handleSave = async () => {
    if (!courseId) return;
    const { error } = await supabase
      .from("courses")
      .update({ title: courseTitle } as any)
      .eq("id", courseId);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Course saved!" });
    }
  };

  if (loading) return null;
  if (!isAdmin) return null;

  const sections = makeSections(completed);
  const allRequiredDone = REQUIRED_STEPS.every((s) => completed[s]);

  const activeLabel =
    sections.flatMap((s) => s.items).find((i) => i.id === activeStep)?.label ?? "";

  const renderStep = () => {
    switch (activeStep) {
      case "intended-learners":
        return <IntendedLearnersStep objectives={objectives} onChange={handleObjectivesChange} />;
      case "curriculum":
        return courseId ? <CurriculumStep courseId={courseId} /> : <PlaceholderStep label="No course selected" />;
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
            {courseTitle}
          </span>
          <Badge variant="secondary" className="bg-muted-foreground/20 text-muted-foreground text-[10px] uppercase tracking-wider shrink-0">
            Draft
          </Badge>
          {savingObjectives && (
            <span className="text-muted-foreground text-xs shrink-0">Saving…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-muted-foreground/30 hover:bg-muted-foreground/40 text-background border-0 rounded-full px-5"
            onClick={handleSave}
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
