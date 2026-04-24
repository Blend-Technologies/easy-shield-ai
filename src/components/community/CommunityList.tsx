import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Pencil, Trash2, Copy, Check } from "lucide-react";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyInviteLink = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}/community/join/${communityId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(communityId);
    toast({ title: "Invite link copied!", description: "Share this link with anyone you'd like to invite." });
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      <div className="grid gap-6 sm:grid-cols-2">
        {communities.map((c) => {
          const inviteLink = `${window.location.origin}/community/join/${c.id}`;
          return (
            <div
              key={c.id}
              className="border border-border rounded-2xl bg-card hover:border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col cursor-pointer"
              onClick={() => navigate(`/community/hub/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/community/hub/${c.id}`)}
            >
              {/* Colored header banner */}
              <div className="h-24 bg-gradient-to-br from-primary/80 via-primary to-violet-700 flex items-end px-6 pb-4 relative flex-shrink-0">
                {c.logo_url && (
                  <img src={c.logo_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0 absolute -bottom-7 left-6 shadow-md">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-white" />
                  )}
                </div>
                {/* Edit / Delete (admin only) */}
                {showActions && (
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span
                      role="button"
                      onClick={(e) => openEdit(c, e)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </span>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteItem(c); }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="pt-10 pb-4 px-6 flex-1">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{c.title}</h3>
                  {c.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{c.subtitle}</p>}
                </div>
                {c.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.description}</p>
                )}
                <div className="flex items-center justify-between">
                  {c.category && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{c.category}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Invite link row — always visible, stops card navigation */}
              {showActions && (
                <div
                  className="mx-4 mb-4 mt-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Invite Link
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={(e) => copyInviteLink(e, c.id)}
                      className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                        copiedId === c.id
                          ? "bg-green-500/10 text-green-600 border border-green-200"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {copiedId === c.id
                        ? <><Check className="w-3 h-3" /> Copied</>
                        : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
