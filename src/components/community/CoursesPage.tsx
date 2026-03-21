import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "@/hooks/use-toast";
import { Bell, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
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

import startHereImg from "@/assets/programs/start-here.jpg";
import mod1Img from "@/assets/programs/module-1-foundations.jpg";
import mod2Img from "@/assets/programs/module-2-strategy.jpg";
import mod3Img from "@/assets/programs/module-3-build.jpg";
import mod4Img from "@/assets/programs/module-4-tech.jpg";
import mod5Img from "@/assets/programs/module-5-distribution.jpg";

type Course = Database["public"]["Tables"]["courses"]["Row"];

const GRADIENTS = [
  "from-orange-400 via-orange-500 to-red-500",
  "from-teal-500 via-cyan-600 to-blue-700",
  "from-purple-500 via-violet-600 to-indigo-700",
  "from-emerald-600 via-green-700 to-green-900",
  "from-cyan-400 via-blue-500 to-blue-700",
  "from-red-600 via-red-700 to-red-900",
];

const isNewCourse = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;

// ─── Course Card ─────────────────────────────────────────────────────────────
interface CourseCardProps {
  course: Course;
  index: number;
  lessonCount: number;
  canManage: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const CourseCard = ({ course, index, lessonCount, canManage, onEdit, onDelete, onClick }: CourseCardProps) => {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const isNew = isNewCourse(course.created_at);
  const pct = 0; // TODO: real enrollment progress

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group"
      onClick={onClick}
    >
      {/* Banner */}
      <div className={`relative h-[170px] bg-gradient-to-br ${gradient} overflow-hidden`}>
        {course.logo_url && (
          <img src={course.logo_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Title overlay on banner */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow">{course.title}</h3>
        </div>

        {/* Admin controls — only visible on hover */}
        {canManage && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              title="Edit course"
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center text-gray-700 shadow transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete course"
              className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-lg flex items-center justify-center text-white shadow transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-gray-900 text-sm leading-snug">{course.title}</h3>
          {isNew && (
            <span className="flex-shrink-0 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              New
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4">
          {course.subtitle || course.description || "No description yet."}
        </p>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>0 / {lessonCount} lessons</span>
          <span className="font-semibold text-gray-700">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

// ─── Add Course Card (admin only) ────────────────────────────────────────────
const AddCourseCard = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-2xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all flex flex-col items-center justify-center gap-3 h-[300px] cursor-pointer group"
  >
    <div className="w-14 h-14 rounded-2xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
      <Plus className="w-7 h-7 text-violet-600" />
    </div>
    <div className="text-center px-4">
      <p className="font-bold text-gray-800 text-sm">Create New Course</p>
      <p className="text-xs text-gray-500 mt-1">Add sections, lectures, videos & materials</p>
    </div>
  </button>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const CoursesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  // A user can manage courses if they are admin OR if they created at least one
  const canManageCourse = (course: Course) =>
    (!adminLoading && isAdmin) || (currentUserId !== null && course.created_by === currentUserId);

  // Show add-course UI if admin or if user has previously created courses
  const showAdminUI = (!adminLoading && isAdmin);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
  });

  const { data: lessonCounts = {} } = useQuery({
    queryKey: ["course_lesson_counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_items")
        .select("section_id, course_sections(course_id)");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((item: { course_sections: { course_id: string } | null }) => {
        const courseId = item.course_sections?.course_id;
        if (courseId) counts[courseId] = (counts[courseId] ?? 0) + 1;
      });
      return counts;
    },
  });

  const handleAddCourse = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please log in", variant: "destructive" }); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("courses")
      .insert({ title: "Untitled Program", created_by: user.id })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Error creating program", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Course created — set up the details now!" });
    navigate(`/community/course-builder/${data.id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("courses").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Error deleting program", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Program deleted" });
    setDeleteTarget(null);
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        </div>
        {showAdminUI && (
          <button
            onClick={handleAddCourse}
            disabled={creating}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? "Creating…" : "Add Course"}
          </button>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-6">Learn at your own pace with our structured programs</p>

      {/* Notification banner */}
      {!notifDismissed && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">🔔 Enable desktop notifications</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Click <span className="font-semibold text-gray-900">Allow notifications</span> to enable browser desktop alerts for DMs, comments/replies, and announcements.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => Notification.requestPermission()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              Allow notifications
            </button>
            <button
              onClick={() => setNotifDismissed(true)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>
          {!adminLoading && isAdmin && (
            <Button onClick={handleAddCourse} className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white gap-2">
              <Plus className="h-4 w-4" />
              Add Program
            </Button>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-6">Learn at your own pace with our structured programs</p>

        {/* Notification Prompt */}
        {showNotifPrompt && (
          <div className="mb-8">
            <NotificationPrompt onDismiss={() => setShowNotifPrompt(false)} />
          </div>
        )}

        {/* Programs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <ProgramCard
              key={course.id}
              course={course}
              index={i}
              isAdmin={!adminLoading && isAdmin}
              onEdit={() => navigate(`/community/course-builder/${course.id}`)}
              onDelete={() => setDeleteTarget(course)}
              onClick={() => navigate(`/community/course-player/${course.id}`)}
            />
          ))}
        </div>
      )}

      {/* Loading */}
      {(isLoading || adminLoading) && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Grid */}
      {!isLoading && !adminLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin: "Add Course" card always first */}
          {showAdminUI && (
            <AddCourseCard onClick={handleAddCourse} />
          )}

          {courses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              index={i}
              lessonCount={course.lesson_count ?? lessonCounts[course.id] ?? 0}
              canManage={canManageCourse(course)}
              onEdit={(e) => { e.stopPropagation(); navigate(`/community/course-builder/${course.id}`); }}
              onDelete={(e) => { e.stopPropagation(); setDeleteTarget(course); }}
              onClick={() => navigate(`/community/course/${course.id}`)}
            />
          ))}

          {/* Empty state for non-admin */}
          {!showAdminUI && courses.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <p className="text-base font-medium">No courses available yet</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This will permanently remove the course and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoursesPage;
