import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Info,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCourseCurriculum,
  type ContentType,
  type MediaType,
  type CourseSection,
  type CourseItem,
} from "@/hooks/useCourseCurriculum";

const CONTENT_TYPES: { type: ContentType; label: string; badge?: string; muted?: boolean }[] = [
  { type: "lecture", label: "Lecture", badge: "With lab" },
  { type: "quiz", label: "Quiz" },
  { type: "coding-exercise", label: "Coding Exercise" },
  { type: "practice-test", label: "Practice Test", muted: true },
  { type: "assignment", label: "Assignment" },
  { type: "role-play", label: "Role Play" },
];

interface Props {
  courseId: string;
}

// Sortable Item Component
interface SortableItemProps {
  item: CourseItem;
  index: number;
  editingId: string | null;
  editingValue: string;
  setEditingValue: (v: string) => void;
  startEdit: (id: string, title: string) => void;
  commitEdit: () => void;
  deleteItem: (id: string) => void;
  contentPickerItemId: string | null;
  setContentPickerItemId: (id: string | null) => void;
  updateItemMediaType: (itemId: string, mediaType: MediaType) => void;
  uploadVideo: (itemId: string, file: File) => Promise<void>;
  expandedItemIds: Set<string>;
  toggleItemExpanded: (id: string) => void;
}

const SortableItem = ({
  item,
  index,
  editingId,
  editingValue,
  setEditingValue,
  startEdit,
  commitEdit,
  deleteItem,
  contentPickerItemId,
  setContentPickerItemId,
  updateItemMediaType,
  uploadVideo,
  expandedItemIds,
  toggleItemExpanded,
}: SortableItemProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showingPicker = contentPickerItemId === item.id;
  const isItemExpanded = expandedItemIds.has(item.id);

  return (
    <div ref={setNodeRef} style={style} className="space-y-0">
      <div
        className={`flex items-center gap-2 border border-border bg-background px-3 py-2.5 group ${
          isItemExpanded ? "rounded-t-md" : "rounded-md"
        }`}
      >
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-foreground font-medium">
          {CONTENT_TYPES.find((c) => c.type === item.type)?.label ?? "Lecture"} {index + 1}:
        </span>
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        {editingId === item.id ? (
          <Input
            autoFocus
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            className="h-7 text-sm flex-1"
          />
        ) : (
          <span
            className="text-sm text-foreground flex-1 cursor-text"
            onClick={() => startEdit(item.id, item.title)}
          >
            {item.title}
          </span>
        )}
        <button
          onClick={() => deleteItem(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
          title="Delete item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {showingPicker ? (
          <button
            className="flex items-center gap-1 text-sm font-medium text-foreground"
            onClick={() => setContentPickerItemId(null)}
          >
            Select content type <X className="h-4 w-4" />
          </button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/5 h-8 px-3"
            onClick={() => setContentPickerItemId(item.id)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Content
          </Button>
        )}
        <button onClick={() => toggleItemExpanded(item.id)} className="p-1 hover:bg-muted rounded transition-colors">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isItemExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Content type picker */}
      {showingPicker && (
        <div className="border border-t-0 border-border rounded-b-md bg-background px-4 py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select the main type of content. Files and links can be added as resources.{" "}
            <a href="#" className="text-primary underline">
              Learn about content types.
            </a>
          </p>
          <div className="flex gap-4">
            {([
              { key: "video" as MediaType, label: "Video", icon: <Play className="h-6 w-6" /> },
              {
                key: "mashup" as MediaType,
                label: "Video & Slide Mashup",
                icon: (
                  <>
                    <Play className="h-5 w-5" />
                    <FileText className="h-4 w-4 -ml-1" />
                  </>
                ),
              },
              { key: "article" as MediaType, label: "Article", icon: <FileText className="h-6 w-6" /> },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  updateItemMediaType(item.id, opt.key);
                  setContentPickerItemId(null);
                }}
                className={`flex flex-col items-center gap-2 border rounded-lg p-4 w-28 transition-colors ${
                  item.media_type === opt.key
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <div className="flex items-center justify-center h-10 w-10 rounded bg-muted">{opt.icon}</div>
                <span className="text-xs font-medium text-center leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded item details */}
      {isItemExpanded && !showingPicker && (
        <div className="border border-t-0 border-border rounded-b-md bg-muted/30 px-4 py-4">
          <div className="text-sm text-muted-foreground">
            {item.media_type ? (
              <div className="space-y-3">
                <p className="font-medium text-foreground">
                  Content type:{" "}
                  <span className="capitalize">{item.media_type === "mashup" ? "Video & Slide Mashup" : item.media_type}</span>
                </p>
                {item.media_type === "article" ? (
                  <p>Add your article content here...</p>
                ) : item.video_url ? (
                  <video
                    src={item.video_url}
                    controls
                    className="w-full max-w-2xl mx-auto rounded-lg"
                  />
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploading(true);
                          await uploadVideo(item.id, file);
                          setUploading(false);
                        }
                      }}
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p>{uploading ? "Uploading..." : "Click to upload video, or drag and drop"}</p>
                    <p className="text-xs mt-1">MP4, WebM, MOV up to 100MB</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Click "+ Content" to select a content type for this item.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sortable Section Component
interface SortableSectionProps {
  section: CourseSection;
  index: number;
  expanded: boolean;
  toggleSectionExpanded: (id: string) => void;
  editingId: string | null;
  editingValue: string;
  setEditingValue: (v: string) => void;
  startEdit: (id: string, title: string) => void;
  commitEdit: () => void;
  deleteSection: (id: string) => void;
  children: React.ReactNode;
}

const SortableSection = ({
  section,
  index,
  expanded,
  toggleSectionExpanded,
  editingId,
  editingValue,
  setEditingValue,
  startEdit,
  commitEdit,
  deleteSection,
  children,
}: SortableSectionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Section header */}
      <div className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 group text-left">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => toggleSectionExpanded(section.id)}>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <span className="font-bold text-sm text-foreground">Section {index + 1}:</span>
        <FileText className="h-4 w-4 text-muted-foreground" />
        {editingId === section.id ? (
          <Input
            autoFocus
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm max-w-xs"
          />
        ) : (
          <span
            className="text-sm text-foreground cursor-text flex-1"
            onClick={(e) => {
              e.stopPropagation();
              startEdit(section.id, section.title);
            }}
          >
            {section.title}
          </span>
        )}
        <button
          onClick={() => deleteSection(section.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
          title="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Items */}
      {expanded && children}
    </div>
  );
};

const CurriculumStep = ({ courseId }: Props) => {
  const {
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
  } = useCourseCurriculum(courseId);

  const [infoBannerVisible, setInfoBannerVisible] = useState(true);
  const [newBannerVisible, setNewBannerVisible] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [contentPickerItemId, setContentPickerItemId] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAddRowSections, setShowAddRowSections] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  };

  const isSectionExpanded = (sectionId: string) => !expandedSections.has(sectionId);

  const toggleAddRow = (sectionId: string, show?: boolean) => {
    setShowAddRowSections((prev) => {
      const next = new Set(prev);
      const shouldShow = show ?? !next.has(sectionId);
      shouldShow ? next.add(sectionId) : next.delete(sectionId);
      return next;
    });
  };

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingValue(currentTitle);
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const val = editingValue.trim() || "Untitled";
    const isSection = sections.some((s) => s.id === editingId);
    if (isSection) {
      await updateSectionTitle(editingId, val);
    } else {
      await updateItemTitle(editingId, val);
    }
    setEditingId(null);
  };

  const handleAddItem = async (sectionId: string, type: ContentType) => {
    const label = CONTENT_TYPES.find((c) => c.type === type)?.label ?? "Item";
    await addItem(sectionId, type, `New ${label}`);
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSections(oldIndex, newIndex);
      }
    }
  };

  const handleItemDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      const oldIndex = section.items.findIndex((i) => i.id === active.id);
      const newIndex = section.items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderItems(sectionId, oldIndex, newIndex);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground">Curriculum</h1>
        <div className="border-b border-border my-4" />
        <p className="text-muted-foreground text-sm">Loading curriculum...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground">Curriculum</h1>
        <Button
          type="button"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5"
          onClick={() => setBulkOpen(true)}
        >
          Bulk Uploader
        </Button>
      </div>
      <div className="border-b border-border mb-6" />

      {/* Info banner */}
      {infoBannerVisible && (
        <div className="rounded-lg border border-border bg-card p-4 mb-4 flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              Here's where you add course content—like lectures, course sections, assignments, and more. Drag the grip
              icon to reorder sections and items.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-primary text-primary hover:bg-primary/5"
              onClick={() => setInfoBannerVisible(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Intro paragraph */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Start putting together your course by creating sections, lectures and practice activities (
        <a href="#" className="text-primary underline">
          quizzes, coding exercises and assignments
        </a>
        ). Use your{" "}
        <a href="#" className="text-primary underline">
          course outline
        </a>{" "}
        to structure your content and label your sections and lectures clearly.
      </p>

      {/* New feature banner */}
      {newBannerVisible && (
        <div className="rounded-lg border border-border bg-card p-4 mb-6 flex items-start gap-3">
          <Badge className="bg-emerald-500 text-white border-0 shrink-0">New</Badge>
          <div>
            <p className="text-sm font-medium text-foreground">
              Check out the latest creation flow improvements, new question types, and AI-assisted features in practice
              tests.
            </p>
            <button
              className="text-sm text-muted-foreground hover:text-foreground mt-1 font-medium"
              onClick={() => setNewBannerVisible(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Sections with drag-and-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section, sIdx) => {
              const expanded = isSectionExpanded(section.id);
              return (
                <SortableSection
                  key={section.id}
                  section={section}
                  index={sIdx}
                  expanded={expanded}
                  toggleSectionExpanded={toggleSectionExpanded}
                  editingId={editingId}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  startEdit={startEdit}
                  commitEdit={commitEdit}
                  deleteSection={deleteSection}
                >
                  <div className="px-4 pb-3 space-y-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleItemDragEnd(section.id)}
                    >
                      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        {section.items.map((item, iIdx) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            index={iIdx}
                            editingId={editingId}
                            editingValue={editingValue}
                            setEditingValue={setEditingValue}
                            startEdit={startEdit}
                            commitEdit={commitEdit}
                            deleteItem={deleteItem}
                            contentPickerItemId={contentPickerItemId}
                            setContentPickerItemId={setContentPickerItemId}
                            updateItemMediaType={updateItemMediaType}
                            uploadVideo={uploadVideo}
                            expandedItemIds={expandedItemIds}
                            toggleItemExpanded={toggleItemExpanded}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {/* Add curriculum item row */}
                    {showAddRowSections.has(section.id) ? (
                      <div className="flex items-center gap-1 flex-wrap pt-1 border border-dashed border-border rounded-md px-3 py-2.5">
                        <button
                          className="text-muted-foreground hover:text-foreground mr-1"
                          onClick={() => toggleAddRow(section.id, false)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {CONTENT_TYPES.map((ct) => (
                          <button
                            key={ct.type}
                            disabled={ct.muted}
                            className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors font-medium ${
                              ct.muted ? "text-muted-foreground/50 cursor-not-allowed" : "text-primary hover:bg-primary/5"
                            }`}
                            onClick={() => {
                              if (!ct.muted) {
                                handleAddItem(section.id, ct.type);
                                toggleAddRow(section.id, false);
                              }
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {ct.label}
                            {ct.badge && (
                              <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0 h-4">
                                {ct.badge}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/5 gap-1 mt-2"
                        onClick={() => toggleAddRow(section.id, true)}
                      >
                        <Plus className="h-4 w-4" />
                        Curriculum item
                      </Button>
                    )}
                  </div>
                </SortableSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add section */}
      <Button
        type="button"
        variant="outline"
        className="mt-4 border-primary text-primary hover:bg-primary/5 gap-1"
        onClick={() => addSection()}
      >
        <Plus className="h-4 w-4" />
        Section
      </Button>

      {/* Bulk uploader modal stub */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Uploader</DialogTitle>
          </DialogHeader>
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            Drag and drop your files here, or click to browse.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumStep;
