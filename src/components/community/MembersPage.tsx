import { useState, useMemo } from "react";
import { MapPin, Search, MessageCircle, Users, Wifi, Clock, Map, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const TAGS = ["AI Engineer", "Data Scientist", "Freelancer", "Consultant", "Software Engineer"];

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "hsl(var(--primary))",
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

const MembersPage = () => {
  const { members, isLoading, updateMember, deleteMember } = useCommunityMembers();
  const { isAdmin } = useIsAdmin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [filterNearMe, setFilterNearMe] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterRecent, setFilterRecent] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  const [editMember, setEditMember] = useState<MemberProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberProfile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const currentUser = members.find((m) => m.id === currentUserId);

  const filtered = useMemo(() => {
    let list = [...members];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          (m.full_name ?? "").toLowerCase().includes(q) ||
          (m.title ?? "").toLowerCase().includes(q) ||
          (m.location ?? "").toLowerCase().includes(q)
      );
    }
    if (locationQuery) {
      const q = locationQuery.toLowerCase();
      list = list.filter((m) => (m.location ?? "").toLowerCase().includes(q));
    }
    if (filterNearMe) {
      list = list.filter((m) => (m.location ?? "").toLowerCase().includes("united states"));
    }
    if (filterOnline) {
      list = list.filter((m) => m.online);
    }
    if (filterRecent) {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (selectedTag && selectedTag !== "all") {
      const q = selectedTag.toLowerCase();
      list = list.filter((m) => (m.title ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [members, searchQuery, locationQuery, filterNearMe, filterOnline, filterRecent, selectedTag]);

  const toggleBio = (id: string) => {
    setExpandedBios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canEdit = (memberId: string) => isAdmin || memberId === currentUserId;

  const totalMembers = members.length;
  const onlineCount = members.filter((m) => m.online).length;
  const adminCount = members.filter((m) => m.roles.includes("admin")).length;

  const stats = [
    { label: "Members", value: totalMembers, active: true },
    { label: "Admins", value: adminCount, active: false },
    { label: "Online", value: onlineCount, active: false },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <div className="flex items-center gap-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  s.active
                    ? "bg-[#1a1a2e] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {s.label} {s.value}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-sm text-muted-foreground"
          onClick={() => setShowMap(!showMap)}
        >
          <Map className="w-4 h-4" />
          {showMap ? "Hide map" : "Show map"}
        </Button>
      </div>

      <div className="flex px-8 gap-8">
        {/* Left panel */}
        <div className="w-[320px] flex-shrink-0 space-y-6">
          {/* Profile card */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-100 via-pink-50 to-rose-100 p-6 text-center">
            {currentUser ? (
              <>
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="avatar" className="w-[90px] h-[90px] rounded-full mx-auto border-4 border-background -mt-12 mb-3 object-cover" />
                ) : (
                  <div className="w-[90px] h-[90px] rounded-full mx-auto border-4 border-background -mt-12 mb-3 flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: colorForId(currentUser.id) }}>
                    {getInitials(currentUser.full_name)}
                  </div>
                )}
                <p className="font-bold text-foreground text-base">{currentUser.full_name ?? "Your Name"}</p>
                <p className="text-sm text-muted-foreground">{currentUser.title || currentUser.company || "Member"}</p>
                {currentUser.location && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {currentUser.location}
                  </p>
                )}
                <Button size="sm" className="mt-4 rounded-full px-6" onClick={() => setEditMember(currentUser)}>
                  Edit profile
                </Button>
              </>
            ) : (
              <div className="py-4">
                <Skeleton className="w-[90px] h-[90px] rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-32 mx-auto mb-2" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            )}
          </div>

          {/* Find members */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-base">Find members</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant={filterNearMe ? "default" : "outline"} size="sm" className="gap-1.5 text-xs rounded-full" onClick={() => setFilterNearMe(!filterNearMe)}>
                <Users className="w-3.5 h-3.5" /> Near me
              </Button>
              <Button variant={filterOnline ? "default" : "outline"} size="sm" className="gap-1.5 text-xs rounded-full" onClick={() => setFilterOnline(!filterOnline)}>
                <Wifi className="w-3.5 h-3.5" /> Online
              </Button>
            </div>
            <Button variant={filterRecent ? "default" : "outline"} size="sm" className="gap-1.5 text-xs rounded-full" onClick={() => setFilterRecent(!filterRecent)}>
              <Clock className="w-3.5 h-3.5" /> Recently joined
            </Button>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Location</label>
              <Input placeholder="Search location" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Tag</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {TAGS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          {showMap && (
            <div className="rounded-xl bg-muted border border-border h-64 flex items-center justify-center mb-6">
              <p className="text-muted-foreground text-sm">🗺️ Map view coming soon</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-foreground">All members</h2>
            <span className="text-sm text-muted-foreground">{filtered.length}</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 py-5">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border">
              {filtered.map((member) => {
                const bio = member.bio ?? "";
                const bioExpanded = expandedBios.has(member.id);
                const bioTruncated = bio.length > 160;
                const displayBio = bioExpanded || !bioTruncated ? bio : bio.slice(0, 160) + "…";

                return (
                  <div key={member.id} className="flex items-start gap-4 py-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name ?? ""} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: colorForId(member.id) }}
                        >
                          {getInitials(member.full_name)}
                        </div>
                      )}
                      {member.online && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-[15px]">{member.full_name ?? "Unnamed"}</p>
                      {member.title && (
                        <p className="text-sm text-muted-foreground truncate">{member.title}</p>
                      )}
                      {member.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {member.location}
                        </p>
                      )}
                      {bio && (
                        <p className="text-[13px] text-muted-foreground/80 mt-1.5 leading-relaxed">
                          {displayBio}
                          {bioTruncated && (
                            <button onClick={() => toggleBio(member.id)} className="text-primary ml-1 hover:underline text-[13px] font-medium">
                              {bioExpanded ? "Show less" : "See more"}
                            </button>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                      {canEdit(member.id) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMember(member)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(member)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                        <MessageCircle className="w-3.5 h-3.5" /> Message
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No members found matching your filters.
                </div>
              )}
            </div>
          )}
        </div>
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
