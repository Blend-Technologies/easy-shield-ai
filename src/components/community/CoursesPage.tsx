import { Lock, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Course = Database["public"]["Tables"]["courses"]["Row"];

type Square = {
  key: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  show: boolean;
};

const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Blue grid pattern SVG component
const BlueGridPattern = ({ className = "" }: { className?: string }) => {
  const squares: Square[] = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => {
      const col = i % 15;
      const row = Math.floor(i / 15);
      const x = col * 26 + 10;
      const y = row * 36 + 10;

      const rand = mulberry32(i + 1337);
      const opacity = rand() * 0.55 + 0.15;
      const size = rand() * 8 + 6;
      const show = rand() < (col / 15) * 0.8 + 0.1;

      return { key: i, x, y, size, opacity, show };
    });
  }, []);

  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMaxYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="300" fill="hsl(var(--foreground))" />
      {squares.map((s) =>
        s.show ? (
          <rect
            key={s.key}
            x={s.x}
            y={s.y}
            width={s.size}
            height={s.size}
            fill="hsl(var(--primary))"
            opacity={s.opacity}
            rx="1"
          />
        ) : null
      )}
    </svg>
  );
};

// Datalumina logo icon
const DataluminaLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      fill="hsl(var(--background))"
      stroke="hsl(var(--background))"
      strokeWidth="1"
    />
  </svg>
);

const CourseCard = ({
  course,
  progress,
  hasAccess,
  isAdmin,
  onEdit,
  onDelete,
}: {
  course: Course;
  progress: number;
  hasAccess: boolean;
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden w-full max-w-[280px]">
    {/* Thumbnail with blue grid pattern */}
    <div className="relative h-36 bg-foreground overflow-hidden">
      <BlueGridPattern className="absolute inset-0 w-full h-full" />

      {/* Admin actions */}
      {isAdmin ? (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/70 backdrop-blur"
            onClick={onEdit}
            aria-label="Edit course"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
            aria-label="Delete course"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {/* Lesson count badge */}
      <div className="absolute top-3 left-3 bg-background/70 backdrop-blur-sm px-2 py-1 rounded">
        <span className="text-[10px] font-semibold text-foreground tracking-wider uppercase">
          {course.lesson_count} LESSONS
        </span>
      </div>

      {/* Course title */}
      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="text-background font-bold text-lg leading-tight">
          {course.title}
        </h3>
      </div>
    </div>

    {/* Card body */}
    <div className="p-4 space-y-3">
      {/* Course type */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground text-sm">Course</span>
      </div>

      {/* Subtitle */}
      <p className="text-muted-foreground text-sm">{course.subtitle}</p>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Progress */}
      <div className="space-y-2">
        <span className="text-muted-foreground text-sm">{progress}% Complete</span>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Private space indicator (only when user has access) */}
      {course.is_private ? (
        hasAccess ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs">Private space</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs">Members only</span>
          </div>
        )
      ) : null}
    </div>
  </div>
);

const CoursesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [userId, setUserId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "Data Freelancer",
    lessonCount: 0,
    isPrivate: true,
  });

  useEffect(() => {
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUserId(data.user?.id ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!alive) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Course[];
    },
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["course_enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", userId as string);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.course_id));
    },
  });

  const enrollmentSet = enrollmentsQuery.data ?? new Set<string>();

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "Data Freelancer", lessonCount: 0, isPrivate: true });
    setEditorOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      title: course.title,
      subtitle: course.subtitle,
      lessonCount: course.lesson_count,
      isPrivate: course.is_private,
    });
    setEditorOpen(true);
  };

  const saveCourse = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("courses")
          .update({
            title: form.title,
            subtitle: form.subtitle,
            lesson_count: Number.isFinite(form.lessonCount) ? form.lessonCount : 0,
            is_private: form.isPrivate,
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert({
          title: form.title,
          subtitle: form.subtitle,
          lesson_count: Number.isFinite(form.lessonCount) ? form.lessonCount : 0,
          is_private: form.isPrivate,
          created_by: userId,
        });
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      setEditorOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  const courses = coursesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30 pt-14">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          {!adminLoading && isAdmin ? (
            <Button type="button" onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const { data, error } = await supabase
                .from("courses")
                .insert({ title: "Untitled Course", created_by: user.id })
                .select()
                .single();
              if (data && !error) {
                navigate(`/community/course-builder/${data.id}`);
              }
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add course
            </Button>
          ) : null}
        </div>

        {/* Hero Section - Two Panel Banner */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="flex h-[550px]">
            {/* Left Panel */}
            <div className="flex-1 bg-card flex items-center justify-center p-12">
              <div className="max-w-md">
                <h2 className="text-[28px] font-bold text-foreground leading-tight mb-4">
                  Launch and scale your freelance business
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get clients, deliver projects, take it full time. Proven playbooks and coaching tailored for the tech industry.
                </p>
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 relative bg-foreground rounded-xl overflow-hidden">
              <BlueGridPattern className="absolute inset-0 w-full h-full" />
              <div className="absolute top-6 left-6">
                <DataluminaLogo />
              </div>
              <div className="absolute bottom-8 left-8">
                <span className="text-background text-[40px] font-bold">Welcome</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => {
            const hasAccess = isAdmin || !course.is_private || enrollmentSet.has(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                progress={0}
                hasAccess={hasAccess}
                isAdmin={!adminLoading && isAdmin}
                onEdit={() => navigate(`/community/course-builder/${course.id}`)}
                onDelete={() => deleteCourse(course.id)}
              />
            );
          })}
        </div>

        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit course" : "Add course"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Title</Label>
                <Input
                  id="course-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-subtitle">Subtitle</Label>
                <Input
                  id="course-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-lessons">Lesson count</Label>
                <Input
                  id="course-lessons"
                  inputMode="numeric"
                  value={String(form.lessonCount)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      lessonCount: Number.parseInt(e.target.value || "0", 10) || 0,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 border border-border rounded-lg p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Private course</div>
                  <div className="text-xs text-muted-foreground">
                    Only enrolled members will see “Private space”.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={form.isPrivate ? "default" : "secondary"}
                  onClick={() => setForm((p) => ({ ...p, isPrivate: !p.isPrivate }))}
                >
                  {form.isPrivate ? "Private" : "Public"}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditorOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveCourse}
                disabled={saving || !form.title.trim() || !userId}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CoursesPage;
