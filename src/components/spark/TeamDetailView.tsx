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
import { ArrowLeft, Pencil, UserPlus, Trash2, Save, Users, FileText } from "lucide-react";
import { Team } from "@/hooks/useTeams";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  team: Team;
  onBack: () => void;
};

const ROLES = ["Project Manager", "Cybersecurity Engineer", "AI Engineer", "Data Analyst"];

const TeamDetailView = ({ team, onBack }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { members, isLoading: membersLoading, addMember, removeMember } = useTeamMembers(team.id);

  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState((team as any).description || "");
  const [savingDesc, setSavingDesc] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Project Manager");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string | null }[]>([]);

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

  // Search profiles as user types
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .ilike("full_name", `%${searchQuery.trim()}%`)
        .limit(10);
      // Filter out users already in the team
      const memberIds = members.map((m) => m.user_id);
      setSearchResults((data || []).filter((p) => !memberIds.includes(p.id)));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, members]);

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast({ title: "Select a user", description: "Please select a user from the search results.", variant: "destructive" });
      return;
    }
    addMember.mutate(
      { userId: selectedUserId, role: newMemberRole },
      {
        onSuccess: () => {
          setAddMemberOpen(false);
          setSelectedUserId("");
          setSearchQuery("");
          setNewMemberRole("Project Manager");
          setSearchResults([]);
        },
      }
    );
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
              <p className="text-sm">No members yet. Add your first team member.</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {members.map((member) => (
                <MemberRow key={member.id} member={member} onRemove={() => removeMember.mutate(member.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog - outside Tabs to avoid z-index issues */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search by name</Label>
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedUserId(""); }}
                placeholder="Type a name to search..."
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="border border-border rounded-md max-h-32 overflow-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => { setSelectedUserId(user.id); setSearchQuery(user.full_name || ""); setSearchResults([]); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                        selectedUserId === user.id ? "bg-accent font-medium" : ""
                      }`}
                    >
                      {user.full_name || "Unnamed User"}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && !selectedUserId && (
                <p className="text-xs text-muted-foreground">No users found</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
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
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId || addMember.isPending}>
              {addMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MemberRow = ({ member, onRemove }: { member: TeamMember; onRemove: () => void }) => {
  const name = member.profile?.full_name || "Unknown User";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const roleColor: Record<string, string> = {
    admin: "bg-primary/10 text-primary",
    member: "bg-secondary text-secondary-foreground",
    viewer: "bg-muted text-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
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
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default TeamDetailView;
