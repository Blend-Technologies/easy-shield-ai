import { GraduationCap, Bell, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
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

const DEFAULT_BANNERS = [startHereImg, mod1Img, mod2Img, mod3Img, mod4Img, mod5Img];
const PROGRESS_COLORS = [
  "bg-orange-400",
  "bg-teal-500",
  "bg-purple-500",
  "bg-green-600",
  "bg-cyan-500",
  "bg-red-500",
];

const ProgramCard = ({
  course,
  index,
  isAdmin,
  onEdit,
  onDelete,
  onClick,
}: {
  course: Course;
  index: number;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) => {
  const banner = DEFAULT_BANNERS[index % DEFAULT_BANNERS.length];
  const barColor = PROGRESS_COLORS[index % PROGRESS_COLORS.length];
  const isNew = index === 0 || index === 3;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        <img src={banner} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <h3 className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg leading-tight drop-shadow-lg">
          {course.title}
        </h3>
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 rounded-md bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-md bg-red-500/90 backdrop-blur flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-gray-900 text-sm">{course.title}</h4>
          {isNew && (
            <span className="flex-shrink-0 bg-[#6B4EFF] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
          {course.description || course.subtitle || "Explore this program module..."}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <span>0 / {course.lesson_count} lessons</span>
          <span>0%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  );
};

const NotificationPrompt = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="bg-[#f0ecff] border border-[#d9d0ff] rounded-xl px-6 py-5 flex items-center justify-between gap-6">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[#ece8ff] flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-[#6B4EFF]" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">🔔 Enable desktop notifications</p>
        <p className="text-gray-500 text-sm mt-0.5">
          Click <strong>Allow notifications</strong> to enable browser desktop alerts for DMs, comments/replies, and announcements.
        </p>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <Button className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white text-sm gap-2 rounded-lg">
        <Bell className="w-4 h-4" />
        Allow notifications
      </Button>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
        Dismiss
      </button>
    </div>
  </div>
);

const CoursesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [userId, setUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(true);

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
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
  });

  const handleAddCourse = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("courses")
      .insert({ title: "Untitled Program", created_by: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Error creating program", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      toast({ title: "Program created" });
      navigate(`/community/course-builder/${data.id}`);
    }
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

  const courses = coursesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-[#6B4EFF]" />
            <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
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

        {courses.length === 0 && !coursesQuery.isLoading && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No programs yet</p>
            {isAdmin && <p className="text-sm mt-1">Click "Add Program" to create your first module.</p>}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This will permanently remove the program along with all its sections, items, and enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoursesPage;
