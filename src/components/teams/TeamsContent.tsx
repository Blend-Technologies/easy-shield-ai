import { useState } from "react";
import { Team } from "@/hooks/useTeams";
import TeamsSidebar from "./TeamsSidebar";
import TeamMainArea from "./TeamMainArea";
import TeamRightPanel from "./TeamRightPanel";
import { useTeamMembers } from "@/hooks/useTeams";

type Props = {
  teams: Team[];
  selectedTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  onCreateTeam: (name: string) => Promise<Team | null>;
  onDeleteTeam: (id: string) => Promise<void>;
  loading: boolean;
  projectName: string;
};

const TeamsContent = ({ teams, selectedTeam, onSelectTeam, onCreateTeam, onDeleteTeam, loading, projectName }: Props) => {
  const { members } = useTeamMembers(selectedTeam?.id || null);
  const [showBanner, setShowBanner] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const onlineMembers = members.filter((m) => m.profile?.online);
  const offlineMembers = members.filter((m) => !m.profile?.online);
  const selectedMember = members.find((m) => m.id === selectedMemberId) || (members[0] || null);
  const totalPeople = members.length;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Teams Sidebar */}
      <TeamsSidebar
        teams={teams}
        selectedTeam={selectedTeam}
        onSelectTeam={onSelectTeam}
        onCreateTeam={onCreateTeam}
        totalPeople={totalPeople}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Notification Banner */}
        {showBanner && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-muted border-b border-border text-sm">
            <span>🔔</span>
            <span className="flex-1 text-muted-foreground">EZShield+AI needs your permission to send notifications</span>
            <button className="px-3 py-1 text-xs font-medium border border-foreground rounded-md hover:bg-accent/10">Enable</button>
            <button className="px-3 py-1 text-xs font-medium border border-border rounded-md text-muted-foreground hover:bg-muted">Remind me</button>
            <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}

        {selectedTeam ? (
          <TeamMainArea
            team={selectedTeam}
            onlineMembers={onlineMembers}
            offlineMembers={offlineMembers}
            onSelectMember={setSelectedMemberId}
            projectName={projectName}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {loading ? "Loading..." : "Create a team to get started"}
          </div>
        )}
      </div>

      {/* Right Detail Panel */}
      {selectedTeam && selectedMember && (
        <TeamRightPanel member={selectedMember} />
      )}
    </div>
  );
};

export default TeamsContent;
