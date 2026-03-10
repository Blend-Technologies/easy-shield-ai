import { useState } from "react";
import { Users, BarChart3, Plus, ChevronsLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Team } from "@/hooks/useTeams";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  teams: Team[];
  selectedTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  onCreateTeam: (name: string) => Promise<Team | null>;
  totalPeople: number;
};

const TeamsSidebar = ({ teams, selectedTeam, onSelectTeam, onCreateTeam, totalPeople }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateTeam(newName.trim());
    setNewName("");
    setDialogOpen(false);
  };

  if (collapsed) {
    return (
      <div className="w-10 flex-shrink-0 border-r border-border bg-card flex flex-col items-center py-3">
        <button onClick={() => setCollapsed(false)} className="p-1 text-muted-foreground hover:text-foreground">
          <Users className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[220px] flex-shrink-0 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-sm font-bold text-foreground">Teams</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(true)} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-1 text-muted-foreground hover:text-foreground">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Team name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button onClick={handleCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Nav items */}
      <nav className="px-2 py-2 space-y-0.5">
        <button className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
          <Users className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">All Teams</span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{teams.length}</span>
        </button>
        <button className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
          <Users className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">All People</span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{totalPeople}</span>
        </button>
        <button className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted">
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Analytics</span>
        </button>
      </nav>

      {/* My Teams */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">My Teams</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {teams.map((team) => {
          const isActive = team.id === selectedTeam?.id;
          const initial = team.name.charAt(0).toUpperCase();
          return (
            <button
              key={team.id}
              onClick={() => onSelectTeam(team)}
              className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
              }`}
            >
              <Avatar className="h-5 w-5 rounded">
                <AvatarFallback className="text-white text-[10px] font-bold rounded" style={{ backgroundColor: team.color }}>
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{team.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamsSidebar;
