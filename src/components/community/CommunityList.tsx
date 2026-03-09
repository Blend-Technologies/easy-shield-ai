import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Community {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  created_at: string;
  created_by?: string;
}

interface Props {
  communities: Community[];
  onRefresh?: () => void;
  showActions?: boolean;
}

const CATEGORIES = [
  "Technology", "Business", "Education", "Health & Wellness",
  "Creative Arts", "Science", "Finance", "Marketing", "Other",
];

const CommunityList = ({ communities, onRefresh, showActions = false }: Props) => {
  const navigate = useNavigate();
  const [editItem, setEditItem] = useState<Community | null>(null);
  const [deleteItem, setDeleteItem] = useState<Community | null>(null);
  const [editForm, setEditForm] = useState({ title: "", subtitle: "", description: "", category: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (c: Community, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({ title: c.title, subtitle: c.subtitle, description: c.description || "", category: c.category || "" });
    setEditItem(c);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    const { error } = await supabase
      .from("courses")
      .update({ title: editForm.title, subtitle: editForm.subtitle, description: editForm.description, category: editForm.category } as any)
      .eq("id", editItem.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error updating", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Community updated" });
      setEditItem(null);
      onRefresh?.();
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const { error } = await supabase.from("courses").delete().eq("id", deleteItem.id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Community deleted" });
      onRefresh?.();
    }
    setDeleteItem(null);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/community/hub`)}
            className="text-left border border-border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-md transition-all group relative"
          >
            {showActions && (
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  role="button"
                  onClick={(e) => openEdit(c, e)}
                  className="p-1.5 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteItem(c); }}
                  className="p-1.5 rounded-md bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{c.title}</p>
                <p className="text-muted-foreground text-xs truncate">{c.subtitle}</p>
              </div>
            </div>
            {c.description && <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{c.description}</p>}
            {c.category && (
              <span className="inline-block text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.category}</span>
            )}
          </button>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-title">Name</Label>
              <Input id="edit-title" className="mt-1.5" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-subtitle">Tagline</Label>
              <Input id="edit-subtitle" className="mt-1.5" value={editForm.subtitle} onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <select id="edit-category" className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="">Select…</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" className="mt-1.5 resize-none" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete community?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteItem?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommunityList;
