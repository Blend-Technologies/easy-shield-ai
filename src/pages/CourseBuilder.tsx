import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Settings, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CourseBuilderSidebar, { type StepId } from "@/components/community/CourseBuilderSidebar";
import IntendedLearnersStep from "@/components/community/coursebuilder/IntendedLearnersStep";
import CurriculumStep from "@/components/community/coursebuilder/CurriculumStep";
import LandingPageStep, { type LandingPageData } from "@/components/community/coursebuilder/LandingPageStep";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  pricing: true,
  promotions: true,
  "course-messages": true,
};

const REQUIRED_STEPS: StepId[] = ["intended-learners", "curriculum", "landing-page"];

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

  const [activeStep, setActiveStep] = useState<StepId>("landing-page");
  const [completed, setCompleted] = useState(INITIAL_COMPLETED);
  const [courseTitle, setCourseTitle] = useState("Untitled Course");
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Intended learners
  const [objectives, setObjectives] = useState<string[]>(["", "", "", ""]);

  // Landing page data
  const [landingPage, setLandingPage] = useState<LandingPageData>({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    website: "",
    is_private: false,
    logo_url: null,
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load course ──────────────────────────────────────────────────────────────
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).single();
    if (error || !data) return;

    setCourseTitle(data.title);
    setLandingPage({
      title: data.title ?? "",
      subtitle: data.subtitle ?? "",
      description: data.description ?? "",
      category: data.category ?? "",
      website: data.website ?? "",
      is_private: data.is_private ?? false,
      logo_url: data.logo_url ?? null,
    });

    const obj = (data as { objectives?: unknown }).objectives;
    if (Array.isArray(obj) && obj.length > 0) {
      setObjectives(obj as string[]);
      setCompleted((prev) => ({ ...prev, "intended-learners": true }));
    }

    if (data.subtitle || data.description) {
      setCompleted((prev) => ({ ...prev, "landing-page": true }));
    }
  }, [courseId]);

  useEffect(() => { loadCourse(); }, [loadCourse]);
  useEffect(() => {
    if (!loading && !isAdmin) navigate("/community/hub", { replace: true });
  }, [loading, isAdmin, navigate]);

  // ── Save landing page to DB ──────────────────────────────────────────────────
  const saveLandingPage = useCallback(async (data: LandingPageData) => {
    if (!courseId) return;
    setSaving(true);
    const { error } = await supabase.from("courses").update({
      title: data.title || "Untitled Course",
      subtitle: data.subtitle ?? "",          // NOT NULL — never send null
      description: data.description || null,
      category: data.category || null,
      website: data.website || null,
      is_private: data.is_private,
      logo_url: data.logo_url,
    }).eq("id", courseId);
    setSaving(false);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return;
    }

    const isComplete = !!(data.title && (data.subtitle || data.description));
    setCompleted((prev) => ({ ...prev, "landing-page": isComplete }));
  }, [courseId]);

  // ── Auto-save landing page with debounce ─────────────────────────────────────
  const handleLandingPageChange = useCallback((data: LandingPageData) => {
    setLandingPage(data);
    setCourseTitle(data.title || courseTitle);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveLandingPage(data), 1000);
  }, [courseTitle, saveLandingPage]);

  // ── Auto-save objectives ─────────────────────────────────────────────────────
  const handleObjectivesChange = useCallback(async (newObjectives: string[]) => {
    setObjectives(newObjectives);
    if (!courseId) return;
    const filled = newObjectives.filter((o) => o.trim().length > 0);
    setCompleted((prev) => ({ ...prev, "intended-learners": filled.length >= 4 }));
    setSaving(true);
    const { error } = await supabase.from("courses").update({ objectives: newObjectives as never }).eq("id", courseId);
    setSaving(false);
    if (error) toast({ title: "Error saving objectives", description: error.message, variant: "destructive" });
  }, [courseId]);

  // ── Save title from top bar ──────────────────────────────────────────────────
  const handleSaveTitle = async () => {
    if (!courseId) return;
    const { error } = await supabase.from("courses").update({ title: courseTitle }).eq("id", courseId);
    if (error) {
      toast({ title: "Error saving title", description: error.message, variant: "destructive" });
      return;
    }
    setLandingPage((prev) => ({ ...prev, title: courseTitle }));
    toast({ title: "Saved" });
  };

  // ── Delete course ────────────────────────────────────────────────────────────
  const handleDeleteCourse = async () => {
    if (!courseId) return;
    setDeleting(true);
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    setDeleting(false);
    if (error) {
      toast({ title: "Error deleting course", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Course deleted" });
    navigate("/community/hub");
  };

  if (loading) return null;
  if (!isAdmin) return null;

  const sections = makeSections(completed);
  const allRequiredDone = REQUIRED_STEPS.every((s) => completed[s]);
  const activeLabel = sections.flatMap((s) => s.items).find((i) => i.id === activeStep)?.label ?? "";

  const renderStep = () => {
    switch (activeStep) {
      case "intended-learners":
        return <IntendedLearnersStep objectives={objectives} onChange={handleObjectivesChange} />;
      case "curriculum":
        return courseId ? <CurriculumStep courseId={courseId} /> : <PlaceholderStep label="No course selected" />;
      case "landing-page":
        return courseId ? (
          <LandingPageStep courseId={courseId} data={landingPage} onChange={handleLandingPageChange} />
        ) : (
          <PlaceholderStep label="No course selected" />
        );
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
          {editingTitle ? (
            <Input
              autoFocus
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); handleSaveTitle(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setEditingTitle(false); handleSaveTitle(); } }}
              className="h-8 text-sm font-semibold max-w-md bg-background/10 border-muted-foreground/30 text-background"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="flex items-center gap-2 text-background font-semibold text-sm truncate max-w-md hover:opacity-80 transition-opacity"
            >
              {courseTitle}
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <Badge variant="secondary" className="bg-muted-foreground/20 text-muted-foreground text-[10px] uppercase tracking-wider shrink-0">
            Draft
          </Badge>
          {saving && (
            <span className="text-muted-foreground text-xs shrink-0 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-muted-foreground/30 hover:bg-muted-foreground/40 text-background border-0 rounded-full px-5"
            onClick={() => saveLandingPage(landingPage)}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
          </Button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            title="Delete course"
            className="text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
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

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseTitle}"? This will permanently remove the course and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseBuilder;
