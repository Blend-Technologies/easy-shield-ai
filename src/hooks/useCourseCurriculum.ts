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
  video_url: string | null;
  article_url: string | null;
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
          video_url: i.video_url as string | null,
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
      video_url: data.video_url as string | null,
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

  const reorderSections = async (oldIndex: number, newIndex: number) => {
    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    
    // Update positions
    const updates = reordered.map((s, idx) => ({ id: s.id, position: idx }));
    setSections(reordered.map((s, idx) => ({ ...s, position: idx })));
    
    // Persist to database
    for (const { id, position } of updates) {
      await supabase.from("course_sections").update({ position }).eq("id", id);
    }
  };

  const reorderItems = async (sectionId: string, oldIndex: number, newIndex: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const items = [...s.items];
        const [moved] = items.splice(oldIndex, 1);
        items.splice(newIndex, 0, moved);
        return { ...s, items: items.map((item, idx) => ({ ...item, position: idx })) };
      })
    );

    // Get updated items for this section
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = [...section.items];
    const [moved] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, moved);
    
    // Persist to database
    for (let i = 0; i < items.length; i++) {
      await supabase.from("course_items").update({ position: i }).eq("id", items[i].id);
    }
  };

  const uploadVideo = async (itemId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${itemId}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      toast({ title: "Error uploading video", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    const { error } = await supabase
      .from("course_items")
      .update({ video_url: publicUrl })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Error saving video URL", description: error.message, variant: "destructive" });
      return;
    }

    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === itemId ? { ...i, video_url: publicUrl } : i)),
      }))
    );

    toast({ title: "Video uploaded successfully" });
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
    reorderSections,
    reorderItems,
    uploadVideo,
    refetch: fetchCurriculum,
  };
};
