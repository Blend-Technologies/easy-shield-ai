import { useState, useMemo } from "react";
import { Search, MessageCircle, Pencil, Trash2, CalendarDays, Globe, MapPin } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCommunityMembers, type MemberProfile } from "@/hooks/useCommunityMembers";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import MemberEditDialog from "./MemberEditDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "hsl(262 83% 75%)",
  "hsl(142 71% 45%)",
  "hsl(0 72% 51%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
];

function colorForId(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash << 5) - hash + c.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function generateHandle(name: string | null, id: string) {
  if (!name) return `@user-${id.slice(0, 4)}`;
  return `@${name.toLowerCase().replace(/\s+/g, "-")}-${id.slice(0, 4)}`;
}

function formatJoinDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const MembersPage = () => {
  const { members, isLoading, updateMember, deleteMember } = useCommunityMembers();
  const { isAdmin } = useIsAdmin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "admins" | "online">("all");
  const [editMember, setEditMember] = useState<MemberProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberProfile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const totalMembers = members.length;
  const onlineCount = members.filter((m) => m.online).length;
  const adminCount = members.filter((m) => m.roles.includes("admin")).length;

  const filtered = useMemo(() => {
    let list = [...members];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          (m.full_name ?? "").toLowerCase().includes(q) ||
          (m.bio ?? "").toLowerCase().includes(q) ||
          (m.location ?? "").toLowerCase().includes(q)
      );
    }
    if (activeFilter === "admins") {
      list = list.filter((m) => m.roles.includes("admin"));
    } else if (activeFilter === "online") {
      list = list.filter((m) => m.online);
    }
    return list;
  }, [members, searchQuery, activeFilter]);

  const canEdit = (memberId: string) => isAdmin || memberId === currentUserId;

  const stats = [
    { key: "all" as const, label: "Members", value: totalMembers },
    { key: "admins" as const, label: "Admins", value: adminCount },
    { key: "online" as const, label: "Online", value: onlineCount },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Stats pills */}
        <div className="flex items-center gap-2 mb-5">
          {stats.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveFilter(s.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeFilter === s.key
                  ? "bg-[#1a1a2e] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label} {s.value}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10 h-10 bg-white border-gray-200 rounded-lg text-sm"
            placeholder="Search members by name, bio, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Member cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((member) => {
              const isAdminMember = member.roles.includes("admin");
              const handle = generateHandle(member.full_name, member.id);
              const level = 1;

              return (
                <div key={member.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:border-gray-200 transition-colors">
                  {/* Avatar with level badge */}
                  <div className="relative flex-shrink-0">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name ?? ""} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: colorForId(member.id) }}
                      >
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#6B4EFF] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                      {level}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{member.full_name ?? "Unnamed"}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAdminMember
                          ? "bg-purple-100 text-purple-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isAdminMember ? "Admin" : "Newcomer"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{handle}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.online ? "bg-green-500" : "bg-gray-300"}`} />
                        {member.online ? "Online" : "Offline"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <CalendarDays className="w-3 h-3" />
                        Joined {formatJoinDate(member.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canEdit(member.id) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditMember(member)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(member)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs h-8 px-3">
                      CHAT <MessageCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                No members found matching your filters.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <MemberEditDialog
        member={editMember}
        open={!!editMember}
        onOpenChange={(open) => { if (!open) setEditMember(null); }}
        onSave={(data) => updateMember.mutate(data)}
        isSaving={updateMember.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.full_name ?? "this member"} from the directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { deleteMember.mutate(deleteTarget.id); setDeleteTarget(null); } }}
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
