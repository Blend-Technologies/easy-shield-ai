import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Info,
  Play,
  Plus,
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

type ContentType = "lecture" | "quiz" | "coding-exercise" | "practice-test" | "assignment" | "role-play";

type MediaType = "video" | "mashup" | "article";

interface LectureItem {
  id: string;
  title: string;
  type: ContentType;
  mediaType?: MediaType;
}

interface Section {
  id: string;
  title: string;
  expanded: boolean;
  showAddRow: boolean;
  items: LectureItem[];
}

const CONTENT_TYPES: { type: ContentType; label: string; badge?: string; muted?: boolean }[] = [
  { type: "lecture", label: "Lecture", badge: "With lab" },
  { type: "quiz", label: "Quiz" },
  { type: "coding-exercise", label: "Coding Exercise" },
  { type: "practice-test", label: "Practice Test", muted: true },
  { type: "assignment", label: "Assignment" },
  { type: "role-play", label: "Role Play" },
];

const INITIAL_SECTIONS: Section[] = [
  {
    id: "s1",
    title: "Introduction",
    expanded: true,
    showAddRow: true,
    items: [{ id: "l1", title: "Introduction", type: "lecture" }],
  },
  {
    id: "s2",
    title: "What are AI Agents?",
    expanded: true,
    showAddRow: false,
    items: [{ id: "l2", title: "What are AI Agents?", type: "lecture" }],
  },
];

let nextId = 100;
const genId = () => `item-${nextId++}`;

const CurriculumStep = () => {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [infoBannerVisible, setInfoBannerVisible] = useState(true);
  const [newBannerVisible, setNewBannerVisible] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [contentPickerItemId, setContentPickerItemId] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const setMediaType = (sectionId: string, itemId: string, media: MediaType) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, mediaType: media } : it)) }
          : s
      )
    );
  };

  const updateSection = (sectionId: string, updater: (s: Section) => Section) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? updater(s) : s)));
  };

  const toggleExpand = (sectionId: string) =>
    updateSection(sectionId, (s) => ({ ...s, expanded: !s.expanded }));

  const toggleAddRow = (sectionId: string, show?: boolean) =>
    updateSection(sectionId, (s) => ({ ...s, showAddRow: show ?? !s.showAddRow }));

  const addItem = (sectionId: string, type: ContentType) => {
    const label = CONTENT_TYPES.find((c) => c.type === type)?.label ?? "Item";
    updateSection(sectionId, (s) => ({
      ...s,
      items: [...s.items, { id: genId(), title: `New ${label}`, type }],
    }));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: genId(),
        title: "New Section",
        expanded: true,
        showAddRow: false,
        items: [],
      },
    ]);
  };

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingValue(currentTitle);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const val = editingValue.trim() || "Untitled";
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === editingId) return { ...s, title: val };
        return {
          ...s,
          items: s.items.map((it) => (it.id === editingId ? { ...it, title: val } : it)),
        };
      })
    );
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground">Curriculum</h1>
        <Button
          type="button"
          variant="outline"
          className="border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/5"
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
              Here's where you add course content—like lectures, course sections, assignments, and more. Click a + icon on the left to get started.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/5"
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
        <a href="#" className="text-primary underline">quizzes, coding exercises and assignments</a>
        ). Use your{" "}
        <a href="#" className="text-primary underline">course outline</a>{" "}
        to structure your content and label your sections and lectures clearly. If you're intending to offer your course for free, the total length of video content must be less than 2 hours.
      </p>

      {/* New feature banner */}
      {newBannerVisible && (
        <div className="rounded-lg border border-border bg-card p-4 mb-6 flex items-start gap-3">
          <Badge className="bg-emerald-500 text-white border-0 shrink-0">New</Badge>
          <div>
            <p className="text-sm font-medium text-foreground">
              Check out the latest creation flow improvements, new question types, and AI-assisted features in practice tests.
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

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 group text-left"
              onClick={() => toggleExpand(section.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              {section.expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-bold text-sm text-foreground">Section {sIdx + 1}:</span>
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
                  className="text-sm text-foreground cursor-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(section.id, section.title);
                  }}
                >
                  {section.title}
                </span>
              )}
            </button>

            {/* Lectures */}
            {section.expanded && (
              <div className="px-4 pb-3 space-y-2">
                {section.items.map((item, iIdx) => {
                  const showingPicker = contentPickerItemId === item.id;
                  const isExpanded = expandedItemIds.has(item.id);
                  return (
                    <div key={item.id} className="space-y-0">
                      <div className={`flex items-center gap-2 border border-border bg-background px-3 py-2.5 group ${isExpanded ? "rounded-t-md" : "rounded-md"}`}>
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground font-medium">
                          {CONTENT_TYPES.find((c) => c.type === item.type)?.label ?? "Lecture"} {iIdx + 1}:
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
                        <button
                          onClick={() => toggleItemExpanded(item.id)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Content type picker */}
                      {showingPicker && (
                        <div className="border border-t-0 border-border rounded-b-md bg-background px-4 py-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Select the main type of content. Files and links can be added as resources.{" "}
                            <a href="#" className="text-primary underline">Learn about content types.</a>
                          </p>
                          <div className="flex gap-4">
                            {[
                              { key: "video" as MediaType, label: "Video", icon: <Play className="h-6 w-6" /> },
                              { key: "mashup" as MediaType, label: "Video & Slide Mashup", icon: <><Play className="h-5 w-5" /><FileText className="h-4 w-4 -ml-1" /></> },
                              { key: "article" as MediaType, label: "Article", icon: <FileText className="h-6 w-6" /> },
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  setMediaType(section.id, item.id, opt.key);
                                  setContentPickerItemId(null);
                                }}
                                className={`flex flex-col items-center gap-2 border rounded-lg p-4 w-28 transition-colors ${
                                  item.mediaType === opt.key
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                                }`}
                              >
                                <div className="flex items-center justify-center h-10 w-10 rounded bg-muted">
                                  {opt.icon}
                                </div>
                                <span className="text-xs font-medium text-center leading-tight">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expanded item details */}
                      {isExpanded && !showingPicker && (
                        <div className="border border-t-0 border-border rounded-b-md bg-muted/30 px-4 py-4">
                          <div className="text-sm text-muted-foreground">
                            {item.mediaType ? (
                              <div className="space-y-3">
                                <p className="font-medium text-foreground">
                                  Content type: <span className="capitalize">{item.mediaType === "mashup" ? "Video & Slide Mashup" : item.mediaType}</span>
                                </p>
                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-background">
                                  {item.mediaType === "article" ? (
                                    <p>Add your article content here...</p>
                                  ) : (
                                    <p>Drag and drop your video file here, or click to browse.</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p>Click "+ Content" to select a content type for this item.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add curriculum item row */}
                {section.showAddRow ? (
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
                          ct.muted
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-primary hover:bg-primary/5"
                        }`}
                        onClick={() => {
                          if (!ct.muted) {
                            addItem(section.id, ct.type);
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
            )}
          </div>
        ))}
      </div>

      {/* Add section */}
      <Button
        type="button"
        variant="outline"
        className="mt-4 border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/5 gap-1"
        onClick={addSection}
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
