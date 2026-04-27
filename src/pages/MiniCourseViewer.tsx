import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MINI_COURSE_COMPONENTS } from "@/components/community/courses/registry";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"];

const MiniCourseViewer = () => {
  const { communityId, courseId } = useParams<{ communityId: string; courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    supabase.from("courses").select("*").eq("id", courseId).single().then(({ data }) => {
      setCourse(data as Course);
      setLoading(false);
    });
  }, [courseId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(`/community/hub/${communityId}/programs`);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [communityId, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const Component = course?.website ? MINI_COURSE_COMPONENTS[course.website] : null;

  if (!Component) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">Course content not found.</p>
        <button
          onClick={() => navigate(`/community/hub/${communityId}/programs`)}
          className="text-amber-400 hover:text-amber-300 text-sm underline"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-14 bg-gray-900 border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => navigate(`/community/hub/${communityId}/programs`)}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programs
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{course?.title}</p>
          {course?.subtitle && (
            <p className="text-white/40 text-xs truncate">{course.subtitle}</p>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20 flex-shrink-0">
          Mini Course
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Component />
      </div>
    </div>
  );
};

export default MiniCourseViewer;
