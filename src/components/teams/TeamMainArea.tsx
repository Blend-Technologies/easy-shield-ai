import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Team, TeamMember } from "@/hooks/useTeams";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`,
  value: i === 15 ? 3 : i === 14 || i === 16 ? 1 : 0,
}));

type Props = {
  team: Team;
  onlineMembers: TeamMember[];
  offlineMembers: TeamMember[];
  onSelectMember: (id: string) => void;
  projectName: string;
};

const TeamMainArea = ({ team, onlineMembers, offlineMembers, onSelectMember, projectName }: Props) => {
  const navigate = useNavigate();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [email, setEmail] = useState("");
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Team Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Avatar className="h-9 w-9 rounded-full">
          <AvatarFallback className="text-white text-sm font-bold rounded-full" style={{ backgroundColor: team.color }}>
            {team.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <span className="font-bold text-foreground">{team.name}</span>
          <span className="ml-2 text-sm text-muted-foreground">@{team.slug}</span>
        </div>
        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add member</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="w-full" onClick={() => { setEmail(""); setAddMemberOpen(false); }}>
                Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-border rounded-none px-6 h-auto py-0 justify-start gap-0">
          <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
            📊 Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="work-items"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            onClick={() => navigate(`/dashboard/${encodeURIComponent(projectName)}/work-items`)}
          >
            🔴 Work Items
          </TabsTrigger>
          <TabsTrigger
            value="sprints"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
            onClick={() => navigate(`/dashboard/${encodeURIComponent(projectName)}/boards`)}
          >
            ⛑️ Sprints
          </TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
            ⏱️ Delivery Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 p-6 space-y-6 mt-0">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-muted text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 rounded hover:bg-muted text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
            <button className="text-sm font-medium text-foreground hover:bg-muted px-2 py-1 rounded">
              {dateLabel} ▾
            </button>
          </div>

          {/* Online Activity Chart */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
              Number of people who were online
            </p>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} barCategoryGap="20%">
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {hourlyData.map((entry, index) => (
                      <Cell key={index} fill={entry.value > 0 ? "hsl(var(--foreground))" : "hsl(var(--muted))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Online/Offline Status */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-foreground text-background px-2.5 py-1 rounded-full">
              {onlineMembers.length} Online
            </span>
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              {offlineMembers.length} Offline
            </span>
            <div className="flex-1" />
            <button className="text-xs text-muted-foreground hover:text-foreground">Sort ▾</button>
          </div>

          {/* Member Cards - Online */}
          <div className="flex flex-wrap gap-3">
            {onlineMembers.length === 0 && offlineMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet. Add members to this team.</p>
            ) : null}
            {onlineMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMember(m.id)}
                className="w-[200px] bg-card border border-border rounded-lg p-3 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-foreground text-background text-xs font-bold">
                          {getInitials(m.profile?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">You</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Nothing to see here</p>
              </button>
            ))}
          </div>

          {/* Offline section */}
          {offlineMembers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Offline</p>
              <div className="flex flex-wrap gap-3">
                {offlineMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMember(m.id)}
                    className="w-[200px] bg-card border border-border rounded-lg p-3 text-left opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                          {getInitials(m.profile?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{m.profile?.full_name || "Unknown"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="flex-1 p-6 mt-0">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Delivery Plan — coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamMainArea;
