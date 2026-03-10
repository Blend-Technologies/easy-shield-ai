import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Plus } from "lucide-react";
import { TeamMember } from "@/hooks/useTeams";

type Props = {
  member: TeamMember;
};

const TeamRightPanel = ({ member }: Props) => {
  const name = member.profile?.full_name || "Unknown User";
  const isOnline = member.profile?.online ?? false;
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full overflow-y-auto">
      {/* Profile Block */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-3">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarFallback className="bg-foreground text-background text-lg font-bold rounded-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm">{name} ▾</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add description...</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-muted-foreground"}`} />
              <span className="text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
          Get StandUp
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-border rounded-none px-4 h-auto py-0 justify-start gap-0">
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-xs">
            Activity
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-xs">
            Tasks (18)
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-xs">
            Comments (0)
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-xs">
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="flex-1 p-4 space-y-4 mt-0">
          {/* Priorities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-foreground">Priorities</span>
                <Info className="w-3 h-3 text-muted-foreground" />
              </div>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center py-4">
              + Add your most important tasks here.
            </p>
          </div>

          {/* Activity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">Activity</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Only the last 24 hours of activity is available on your current plan
            </p>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 p-4 mt-0">
          <p className="text-sm text-muted-foreground text-center py-8">Tasks view — coming soon</p>
        </TabsContent>
        <TabsContent value="comments" className="flex-1 p-4 mt-0">
          <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
        </TabsContent>
        <TabsContent value="calendar" className="flex-1 p-4 mt-0">
          <p className="text-sm text-muted-foreground text-center py-8">Calendar view — coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamRightPanel;
