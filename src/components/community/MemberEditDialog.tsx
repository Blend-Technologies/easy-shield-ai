import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MemberProfile } from "@/hooks/useCommunityMembers";

interface MemberEditDialogProps {
  member: MemberProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<MemberProfile> & { id: string }) => void;
  isSaving: boolean;
}

const MemberEditDialog = ({ member, open, onOpenChange, onSave, isSaving }: MemberEditDialogProps) => {
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    location: "",
    bio: "",
    avatar_url: "",
    company: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name ?? "",
        title: member.title ?? "",
        location: member.location ?? "",
        bio: member.bio ?? "",
        avatar_url: member.avatar_url ?? "",
        company: member.company ?? "",
      });
    }
  }, [member]);

  const handleSave = () => {
    if (!member) return;
    onSave({ id: member.id, ...form });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Title / Role</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AI Engineer" />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Toronto, Canada" />
          </div>
          <div className="space-y-1.5">
            <Label>Avatar URL</Label>
            <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberEditDialog;
