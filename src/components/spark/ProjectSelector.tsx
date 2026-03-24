import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, ArrowLeft, AlertTriangle, Pencil, Heart, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SparkProject, Priority } from "@/hooks/useSparkProjects";

// ── Project color palette ────────────────────────────────────────────────────
const COLORS = [
  { bg: "bg-violet-500",  light: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-sky-500",     light: "bg-sky-100 dark:bg-sky-900/40",         text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-emerald-500", light: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-orange-500",  light: "bg-orange-100 dark:bg-orange-900/40",   text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-pink-500",    light: "bg-pink-100 dark:bg-pink-900/40",       text: "text-pink-700 dark:text-pink-300" },
  { bg: "bg-amber-500",   light: "bg-amber-100 dark:bg-amber-900/40",     text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-cyan-500",    light: "bg-cyan-100 dark:bg-cyan-900/40",       text: "text-cyan-700 dark:text-cyan-300" },
  { bg: "bg-rose-500",    light: "bg-rose-100 dark:bg-rose-900/40",       text: "text-rose-700 dark:text-rose-300" },
];

function projectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITIES: { value: Priority; label: string; dot: string; badge: string }[] = [
  { value: "none",     label: "No Priority",  dot: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground" },
  { value: "low",      label: "Low",          dot: "bg-sky-400",             badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
  { value: "medium",   label: "Medium",       dot: "bg-amber-400",           badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  { value: "high",     label: "High",         dot: "bg-orange-500",          badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  { value: "critical", label: "Critical",     dot: "bg-red-500",             badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
];

function getPriority(value: Priority) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[0];
}

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  projects: SparkProject[];
  loading: boolean;
  onSelect: (project: SparkProject) => void;
  onCreate: (name: string, description?: string) => Promise<SparkProject | null>;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, name: string, description?: string) => Promise<boolean>;
  onToggleFavorite: (id: string, current: boolean) => Promise<boolean>;
  onSetPriority: (id: string, priority: Priority) => Promise<boolean>;
};

const ProjectSelector = ({
  projects, loading, onSelect, onCreate, onDelete, onUpdate, onToggleFavorite, onSetPriority,
}: Props) => {
  const navigate = useNavigate();

  // Create dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<SparkProject | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<SparkProject | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const project = await onCreate(name.trim(), description.trim());
    if (project) {
      setOpen(false);
      setName("");
      setDescription("");
      onSelect(project);
    }
    setCreating(false);
  };

  const openEdit = (project: SparkProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditTarget(project);
  };

  const handleUpdate = async () => {
    if (!editTarget || !editName.trim()) return;
    setSaving(true);
    const ok = await onUpdate(editTarget.id, editName, editDescription);
    setSaving(false);
    if (ok) setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) return;
    setDeleting(true);
    await onDelete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteConfirmName("");
  };

  // Sort: favorites first, then by updated_at
  const sorted = [...projects].sort((a, b) => {
    if (a.is_favorite === b.is_favorite) return 0;
    return a.is_favorite ? -1 : 1;
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">S.P.A.R.K.™ Projects</h1>
          <p className="text-muted-foreground text-sm">Select an existing project or create a new one to get started.</p>
        </div>

        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {sorted.map((project) => {
                const color = projectColor(project.id);
                const priority = getPriority(project.priority);
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => onSelect(project)}
                  >
                    {/* Colorful project icon */}
                    <div className={`w-11 h-11 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-white font-bold text-lg leading-none select-none">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm truncate">{project.name}</h3>
                        {project.is_favorite && (
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 flex-shrink-0" />
                        )}
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* Priority badge (inline dropdown) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${priority.badge} hover:opacity-80 transition-opacity`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} flex-shrink-0`} />
                              {priority.label}
                              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                            {PRIORITIES.map((p) => (
                              <DropdownMenuItem
                                key={p.value}
                                className="gap-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSetPriority(project.id, p.value);
                                }}
                              >
                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                {p.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <span className="text-[11px] text-muted-foreground/60">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {/* Heart / favorite */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 transition-colors ${
                          project.is_favorite
                            ? "text-rose-500 hover:text-rose-600"
                            : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-rose-400"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(project.id, project.is_favorite);
                        }}
                      >
                        <Heart className={`w-4 h-4 ${project.is_favorite ? "fill-rose-500" : ""}`} />
                      </Button>
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => openEdit(project, e)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Edit Project dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Project name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <Textarea
              placeholder="Description (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button disabled={!editName.trim() || saving} onClick={handleUpdate}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All tasks, activity, and data associated with this project will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-foreground">
              To confirm, type <strong className="font-semibold">{deleteTarget?.name}</strong> below:
            </p>
            <Input
              placeholder="Type the project name..."
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && deleteConfirmName === deleteTarget?.name && handleDelete()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmName(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmName !== deleteTarget?.name || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectSelector;
