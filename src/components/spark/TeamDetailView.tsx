import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, UserPlus, Trash2, Save, Users, FileText, Mail, Clock, X } from "lucide-react";
import { Team } from "@/hooks/useTeams";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type PendingInvite = {
  id: string;
  email: string;
  full_name: string;
  title: string;
  created_at: string;
  expires_at: string;
};

type Props = {
  team: Team;
  onBack: () => void;
};

const ROLES = ["Project Manager", "Cybersecurity Engineer", "AI Engineer", "Data Analyst"];

const TeamDetailView = ({ team, onBack }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { members, isLoading: membersLoading, addMember, removeMember, updateMemberRole } = useTeamMembers(team.id);

  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState("");

  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState((team as any).description || "");
  const [savingDesc, setSavingDesc] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTitle, setInviteTitle] = useState("Project Manager");
  const [inviteSending, setInviteSending] = useState(false);

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const handleSaveDescription = async () => {
    setSavingDesc(true);
    const { error } = await supabase
      .from("teams")
      .update({ description } as any)
      .eq("id", team.id);
    setSavingDesc(false);
    if (error) {
      toast({ title: "Error saving description", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Description updated" });
      setEditingDesc(false);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    }
  };

  const fetchPendingInvites = async () => {
    setInvitesLoading(true);
    const { data } = await supabase
      .from("team_invitations")
      .select("id, email, full_name, title, created_at, expires_at")
      .eq("team_id", team.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingInvites(data || []);
    setInvitesLoading(false);
  };

  useEffect(() => {
    fetchPendingInvites();
  }, [team.id]);

  const handleSendInvite = async () => {
    if (!inviteFullName.trim()) {
      toast({ title: "Full name required", variant: "destructive" });
      return;
    }
    if (!inviteEmail.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setInviteSending(true);
    const res = await supabase.functions.invoke("invite-team-member", {
      body: { action: "send", team_id: team.id, email: inviteEmail.trim(), full_name: inviteFullName.trim(), title: inviteTitle },
    });
    setInviteSending(false);

    if (res.error || res.data?.error) {
      toast({ title: "Failed to send invitation", description: res.data?.error ?? res.error?.message, variant: "destructive" });
      return;
    }

    toast({ title: "Invitation sent", description: `An email has been sent to ${inviteEmail.trim()}.` });
    setAddMemberOpen(false);
    setInviteFullName("");
    setInviteEmail("");
    setInviteTitle("Project Manager");
    fetchPendingInvites();
  };

  const handleCancelInvite = async (inviteId: string) => {
    const res = await supabase.functions.invoke("invite-team-member", {
      body: { action: "cancel", invitation_id: inviteId, team_id: team.id },
    });
    if (res.error || res.data?.error) {
      toast({ title: "Failed to cancel invitation", variant: "destructive" });
      return;
    }
    toast({ title: "Invitation cancelled" });
    fetchPendingInvites();
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="h-9 w-9 rounded-lg">
            <AvatarFallback
              className="text-white font-bold rounded-lg"
              style={{ backgroundColor: team.color }}
            >
              {team.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{team.name}</h1>
            <p className="text-xs text-muted-foreground">@{team.slug}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="px-6 pt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Members
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {members.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Description</h2>
              {!editingDesc && (
                <Button variant="ghost" size="sm" onClick={() => setEditingDesc(true)} className="h-7 text-xs gap-1">
                  <Pencil className="w-3 h-3" />
                  Edit
                </Button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this team does, its goals, and responsibilities..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDescription} disabled={savingDesc} className="gap-1">
                    <Save className="w-3 h-3" />
                    {savingDesc ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingDesc(false); setDescription((team as any).description || ""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {(team as any).description || "No description yet. Click Edit to add one."}
              </p>
            )}
          </div>

          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-foreground mb-2">Team Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="text-foreground">{new Date(team.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Members</span>
                <p className="text-foreground">{members.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Color</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-foreground">{team.color}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
            <Button size="sm" onClick={() => setAddMemberOpen(true)} className="gap-1.5 h-8">
              <UserPlus className="w-3.5 h-3.5" />
              Add Member
            </Button>
          </div>

          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No members yet. Invite your first team member.</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onRemove={() => removeMember.mutate(member.id)}
                  onEdit={() => { setEditMember(member); setEditRole(member.role); }}
                />
              ))}
            </div>
          )}

          {pendingInvites.length > 0 && (
            <div className="max-w-2xl mt-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Pending Invitations
              </h3>
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{inv.title}</Badge>
                    <Badge variant="secondary" className="text-[10px] shrink-0">Pending</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleCancelInvite(inv.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={(open) => {
        setAddMemberOpen(open);
        if (!open) { setInviteFullName(""); setInviteEmail(""); setInviteTitle("Project Manager"); }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full Name</Label>
              <Input
                id="invite-name"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="Jane Smith"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Select value={inviteTitle} onValueChange={setInviteTitle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              An invitation email will be sent. The link expires in 7 days.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendInvite}
              disabled={inviteSending || !inviteFullName.trim() || !inviteEmail.trim()}
            >
              {inviteSending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Role Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null); }}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Member</Label>
              <p className="text-sm font-medium text-foreground">{editMember?.profile?.full_name || "Unknown User"}</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editMember) {
                  updateMemberRole.mutate(
                    { memberId: editMember.id, role: editRole },
                    { onSuccess: () => setEditMember(null) }
                  );
                }
              }}
              disabled={updateMemberRole.isPending || editRole === editMember?.role}
            >
              {updateMemberRole.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MemberRow = ({ member, onRemove, onEdit }: { member: TeamMember; onRemove: () => void; onEdit: () => void }) => {
  const name = member.profile?.full_name || "Unknown User";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const roleColor: Record<string, string> = {
    admin: "bg-primary/10 text-primary",
    member: "bg-secondary text-secondary-foreground",
    viewer: "bg-muted text-muted-foreground",
  };

  const isOnline = member.profile?.online;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
            isOnline ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        {member.profile?.title && (
          <p className="text-xs text-muted-foreground truncate">{member.profile.title}</p>
        )}
      </div>
      <Badge variant="outline" className={`text-[10px] ${roleColor[member.role] || ""}`}>
        {member.role}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={onEdit}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default TeamDetailView;
