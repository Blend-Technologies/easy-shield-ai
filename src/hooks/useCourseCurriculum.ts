import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ContentType = "lecture" | "quiz" | "coding-exercise" | "practice-test" | "assignment" | "role-play";
export type MediaType = "video" | "mashup" | "article";

export interface CourseItem {
  id: string;
  section_id: string;
  title: string;
  type: ContentType;
  media_type: MediaType | null;
  position: number;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  position: number;
  items: CourseItem[];
}

export const useCourseCurriculum = (courseId: string | undefined) => {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurriculum = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    const { data: sectionRows, error: secErr } = await supabase
      .from("course_sections")
      .select("*")
      .eq("course_id", courseId)
      .order("position");

    if (secErr) {
      toast({ title: "Error loading sections", description: secErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: itemRows, error: itemErr } = await supabase
      .from("course_items")
      .select("*")
      .in("section_id", (sectionRows ?? []).map((s) => s.id))
      .order("position");

    if (itemErr) {
      toast({ title: "Error loading items", description: itemErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const mapped: CourseSection[] = (sectionRows ?? []).map((s) => ({
      id: s.id,
      course_id: s.course_id,
      title: s.title,
      position: s.position,
      items: (itemRows ?? [])
        .filter((i) => i.section_id === s.id)
        .map((i) => ({
          id: i.id,
          section_id: i.section_id,
          title: i.title,
          type: i.type as ContentType,
          media_type: i.media_type as MediaType | null,
          position: i.position,
        })),
    }));

    setSections(mapped);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  const addSection = async (title = "New Section") => {
    if (!courseId) return;
    const position = sections.length;
    const { data, error } = await supabase
      .from("course_sections")
      .insert({ course_id: courseId, title, position })
      .select()
      .single();
    if (error) {
      toast({ title: "Error adding section", description: error.message, variant: "destructive" });
      return;
    }
    setSections((prev) => [...prev, { ...data, items: [] }]);
  };

  const updateSectionTitle = async (sectionId: string, title: string) => {
    const { error } = await supabase
      .from("course_sections")
      .update({ title })
      .eq("id", sectionId);
    if (error) {
      toast({ title: "Error updating section", description: error.message, variant: "destructive" });
      return;
    }
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, title } : s)));
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await supabase.from("course_sections").delete().eq("id", sectionId);
    if (error) {
      toast({ title: "Error deleting section", description: error.message, variant: "destructive" });
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const addItem = async (sectionId: string, type: ContentType, title: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const position = section ? section.items.length : 0;
    const { data, error } = await supabase
      .from("course_items")
      .insert({ section_id: sectionId, title, type, position })
      .select()
      .single();
    if (error) {
      toast({ title: "Error adding item", description: error.message, variant: "destructive" });
      return;
    }
    const newItem: CourseItem = {
      id: data.id,
      section_id: data.section_id,
      title: data.title,
      type: data.type as ContentType,
      media_type: data.media_type as MediaType | null,
      position: data.position,
    };
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s))
    );
  };

  const updateItemTitle = async (itemId: string, title: string) => {
    const { error } = await supabase.from("course_items").update({ title }).eq("id", itemId);
    if (error) {
      toast({ title: "Error updating item", description: error.message, variant: "destructive" });
      return;
    }
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === itemId ? { ...i, title } : i)),
      }))
    );
  };

  const updateItemMediaType = async (itemId: string, mediaType: MediaType) => {
    const { error } = await supabase.from("course_items").update({ media_type: mediaType }).eq("id", itemId);
    if (error) {
      toast({ title: "Error updating item", description: error.message, variant: "destructive" });
      return;
    }
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === itemId ? { ...i, media_type: mediaType } : i)),
      }))
    );
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from("course_items").delete().eq("id", itemId);
    if (error) {
      toast({ title: "Error deleting item", description: error.message, variant: "destructive" });
      return;
    }
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== itemId),
      }))
    );
  };

  return {
    sections,
    loading,
    addSection,
    updateSectionTitle,
    deleteSection,
    addItem,
    updateItemTitle,
    updateItemMediaType,
    deleteItem,
    refetch: fetchCurriculum,
  };
};
