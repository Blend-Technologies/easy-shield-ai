import { useState } from "react";
import { Search, Trash2, UserPlus, Circle, Mail, UserRoundPlus } from "lucide-react";
import { useCommunityMembers, MemberProfile } from "@/hooks/useCommunityMembers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const MembersManagementPanel = () => {
  const { members, isLoading, deleteMember } = useCommunityMembers();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "online">("all");

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Manual create state
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createCompany, setCreateCompany] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.company?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || m.online;
    return matchesSearch && matchesFilter;
  });

  const handleRemove = (member: MemberProfile) => {
    if (confirm(`Remove ${member.full_name || "this member"}?`)) {
      deleteMember.mutate(member.id);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("invite-member", {
        body: { action: "invite", email: inviteEmail.trim() },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "Invitation sent", description: `Invite email sent to ${inviteEmail}` });
      setInviteEmail("");
    } catch (e: any) {
      toast({ title: "Failed to invite", description: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleCreate = async () => {
    if (!createEmail.trim()) return;
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("invite-member", {
        body: {
          action: "create",
          email: createEmail.trim(),
          full_name: createName.trim(),
          title: createTitle.trim(),
          company: createCompany.trim(),
          location: createLocation.trim(),
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "Member created", description: `${createName || createEmail} has been added. A password reset email will be sent.` });
      setCreateEmail("");
      setCreateName("");
      setCreateTitle("");
      setCreateCompany("");
      setCreateLocation("");
    } catch (e: any) {
      toast({ title: "Failed to create member", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <h1 className="text-xl font-bold text-foreground mb-4">Members Management</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "online"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Add member panel with tabs */}
      {showAddForm && (
        <div className="rounded-xl border border-border shadow-sm bg-card p-4 mb-4">
          <Tabs defaultValue="invite">
            <TabsList className="mb-3">
              <TabsTrigger value="invite" className="gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5" /> Send Invite
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-1.5 text-xs">
                <UserRoundPlus className="w-3.5 h-3.5" /> Create Manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite">
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                  placeholder="Enter email address to invite…"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {inviting ? "Sending…" : "Send Invite"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                An invitation email with a signup link will be sent to this address.
              </p>
            </TabsContent>

            <TabsContent value="create">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="bg-muted rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                    placeholder="Email address *"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                  />
                  <input
                    className="bg-muted rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                    placeholder="Full name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                  <input
                    className="bg-muted rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                    placeholder="Title / Role"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                  />
                  <input
                    className="bg-muted rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                    placeholder="Company"
                    value={createCompany}
                    onChange={(e) => setCreateCompany(e.target.value)}
                  />
                </div>
                <input
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary"
                  placeholder="Location"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    A password reset email will be sent so the member can set their password.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !createEmail.trim()}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create Member"}
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Members table */}
      <div className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No members found.</div>
        ) : (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_100px_60px] px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted">
              <span>Member</span>
              <span>Role</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_120px_100px_60px] items-center px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      member.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || "U")}&background=5865F2&color=fff&size=36`
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.full_name || "Unnamed"}</p>
                    {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
                  </div>
                </div>
                <span className="flex items-center gap-1.5">
                  {member.roles.map((role) => (
                    <span
                      key={role}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  ))}
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <Circle
                    className={`w-2.5 h-2.5 fill-current ${member.online ? "text-green-500" : "text-muted-foreground/40"}`}
                  />
                  {member.online ? "Online" : "Offline"}
                </span>
                <button
                  onClick={() => handleRemove(member)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-3">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default MembersManagementPanel;
