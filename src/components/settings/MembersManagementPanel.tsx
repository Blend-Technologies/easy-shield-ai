import { useState } from "react";
import { Search, Trash2, UserPlus, Circle } from "lucide-react";
import { useCommunityMembers, MemberProfile } from "@/hooks/useCommunityMembers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MembersManagementPanel = () => {
  const { members, isLoading, deleteMember } = useCommunityMembers();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [filter, setFilter] = useState<"all" | "online">("all");

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

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Members Management</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 w-full"
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
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </button>
      </div>

      {/* Invite form */}
      {showAddForm && (
        <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-4 mb-4 flex items-center gap-3">
          <input
            className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none border border-gray-200 focus:border-[#5865F2]"
            placeholder="Enter email address to invite…"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button
            onClick={() => {
              if (!newEmail.trim()) return;
              toast({ title: "Invitation sent", description: `Invite sent to ${newEmail}` });
              setNewEmail("");
              setShowAddForm(false);
            }}
            className="px-4 py-2 text-sm font-medium bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
          >
            Send Invite
          </button>
        </div>
      )}

      {/* Members table */}
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No members found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_100px_60px] px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
              <span>Member</span>
              <span>Role</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_120px_100px_60px] items-center px-5 py-3 hover:bg-gray-50 transition-colors"
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
                    <p className="text-sm font-medium text-gray-900">{member.full_name || "Unnamed"}</p>
                    {member.title && <p className="text-xs text-gray-400">{member.title}</p>}
                  </div>
                </div>
                <span className="flex items-center gap-1.5">
                  {member.roles.map((role) => (
                    <span
                      key={role}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  ))}
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <Circle
                    className={`w-2.5 h-2.5 fill-current ${member.online ? "text-green-500" : "text-gray-300"}`}
                  />
                  {member.online ? "Online" : "Offline"}
                </span>
                <button
                  onClick={() => handleRemove(member)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default MembersManagementPanel;
