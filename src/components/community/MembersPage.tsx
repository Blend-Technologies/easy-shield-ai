import { useState, useMemo, useEffect } from "react";
import { MessageSquare, CalendarDays, Search, UserPlus, Loader2, X, Mail, Trash2 } from "lucide-react";
import { useCommunityMembers, type MemberProfile } from "@/hooks/useCommunityMembers";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MemberEditDialog from "./MemberEditDialog";

// ── helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getHandle(member: MemberProfile) {
  const base = (member.full_name ?? "member").toLowerCase().replace(/\s+/g, "-");
  const suffix = member.id.slice(0, 4);
  return `@${base}-${suffix}`;
}

function formatJoined(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const AVATAR_COLORS = ["#7c6af7", "#6366f1", "#8b5cf6", "#a78bfa", "#818cf8"];
function colorForId(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash << 5) - hash + c.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRoleBadge(member: MemberProfile): string {
  if (member.roles.includes("admin")) return "Admin";
  return "Newcomer";
}

// ── Status dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ online }: { online: boolean }) => (
  <span
    className={`w-2.5 h-2.5 rounded-full border-2 border-white inline-block ${
      online ? "bg-green-500" : "bg-gray-300"
    }`}
  />
);

// ── Member Card ───────────────────────────────────────────────────────────────
const MemberCard = ({
  member,
  online,
  canEdit,
  isAdmin,
  onEdit,
  onDelete,
}: {
  member: MemberProfile;
  online: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const color = colorForId(member.id);
  const badge = getRoleBadge(member);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.full_name ?? ""} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: color }}
          >
            {getInitials(member.full_name)}
          </div>
        )}
        {/* Online indicator on avatar */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
            online ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        {/* Level badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
          1
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-[15px]">{member.full_name ?? "Unnamed"}</span>
          <span className="text-[11px] font-semibold bg-gray-800 text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{getHandle(member)}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <StatusDot online={online} />
            <span className={online ? "text-green-600 font-medium" : "text-gray-400"}>
              {online ? "Online" : "Offline"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Joined {formatJoined(member.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {canEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Edit
          </button>
        )}
        {isAdmin && (
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Remove
          </button>
        )}
        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">
          <MessageSquare className="w-4 h-4" />
          CHAT
        </button>
      </div>
    </div>
  );
};

// ── Invite Modal ──────────────────────────────────────────────────────────────
const InviteModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);

    // Store the intended role in the invitations table so the trigger can assign it on signup
    const { data: { user } } = await supabase.auth.getUser();
    const { error: inviteErr } = await supabase.from("invitations").upsert(
      { email: email.trim(), role, invited_by: user?.id ?? null },
      { onConflict: "email" }
    );
    if (inviteErr) {
      toast({ title: "Failed to save invitation", description: inviteErr.message, variant: "destructive" });
      setSending(false);
      return;
    }

    // Send the magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (error) {
      toast({ title: "Failed to send invite", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Invite sent!", description: `A magic link was sent to ${email.trim()} as ${role}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Invite a Member</h2>
            <p className="text-sm text-gray-500 mt-0.5">They'll receive a magic link to join the community.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="member@example.com"
              autoFocus
              className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
            <div className="flex gap-3">
              {(["member", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 h-11 rounded-xl border-2 text-sm font-semibold capitalize transition-colors ${
                    role === r
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {r === "admin" ? "👑 Admin" : "👤 Member"}
                </button>
              ))}
            </div>
            {role === "admin" && (
              <p className="text-xs text-amber-600 mt-1.5">
                Admins can create courses, manage members, and moderate content.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={sending || !email.trim()}
              className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {sending ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Registered Members (joined via invite link) ───────────────────────────────
type RegisteredMember = { id: string; full_name: string; email: string; joined_at: string };

const RegisteredMembersSection = ({ communityId, isAdmin }: { communityId: string; isAdmin: boolean }) => {
  const [members, setMembers] = useState<RegisteredMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("community_members" as any)
      .select("id, full_name, email, joined_at")
      .eq("community_id", communityId)
      .order("joined_at", { ascending: false })
      .then(({ data }) => {
        setMembers((data as RegisteredMember[]) ?? []);
        setLoading(false);
      });
  }, [communityId]);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    await supabase.from("community_members" as any).delete().eq("id", id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setRemoving(null);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading registered members…
    </div>
  );

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Registered Members</h3>
          <p className="text-xs text-gray-400 mt-0.5">People who joined via your invite link</p>
        </div>
        <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
          {members.length} registered
        </span>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-400 text-sm">
          No registrations yet. Share your invite link to get members.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                {isAdmin && <th className="px-5 py-3 w-12" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{m.full_name}</td>
                  <td className="px-5 py-3.5 text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    {m.email}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={removing === m.id}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        {removing === m.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
type TabFilter = "members" | "admins" | "online";

const MembersPage = ({ communityId }: { communityId?: string }) => {
  const { members, isLoading, updateMember, deleteMember } = useCommunityMembers();
  const { isAdmin } = useIsAdmin();
  const { onlineIds } = usePresence();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabFilter>("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [editMember, setEditMember] = useState<MemberProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberProfile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const isOnline = (member: MemberProfile) => onlineIds.has(member.id);
  const canEdit = (memberId: string) => isAdmin || memberId === currentUserId;

  const adminCount = useMemo(() => members.filter((m) => m.roles.includes("admin")).length, [members]);
  const onlineCount = useMemo(() => members.filter((m) => onlineIds.has(m.id)).length, [members, onlineIds]);

  const filtered = useMemo(() => {
    let list = [...members];
    if (tab === "admins") list = list.filter((m) => m.roles.includes("admin"));
    if (tab === "online") list = list.filter((m) => onlineIds.has(m.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          (m.full_name ?? "").toLowerCase().includes(q) ||
          (m.bio ?? "").toLowerCase().includes(q) ||
          (m.location ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [members, tab, searchQuery, onlineIds]);

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "members", label: "Members", count: members.length },
    { key: "admins", label: "Admins", count: adminCount },
    { key: "online", label: "Online", count: onlineCount },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Tabs + Invite button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t.label} {t.count}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name, bio, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                online={isOnline(member)}
                canEdit={canEdit(member.id)}
                isAdmin={isAdmin}
                onEdit={() => setEditMember(member)}
                onDelete={() => setDeleteTarget(member)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">No members found.</div>
            )}
          </div>
        )}
      </div>

      {/* Registered members (via invite link) */}
      {communityId && <RegisteredMembersSection communityId={communityId} isAdmin={isAdmin} />}

      {/* Invite modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* Edit dialog */}
      <MemberEditDialog
        member={editMember}
        open={!!editMember}
        onOpenChange={(open) => { if (!open) setEditMember(null); }}
        onSave={(data) => updateMember.mutate(data)}
        isSaving={updateMember.isPending}
      />

      {/* Remove confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.full_name ?? "this member"} from the directory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteMember.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MembersPage;
