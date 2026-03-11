import DashboardTopBar from "./DashboardTopBar";
import DashboardEditBar from "./DashboardEditBar";
import AISummaryPanel from "./AISummaryPanel";
import StatsWorkloadPanel from "./StatsWorkloadPanel";
import TasksByAssigneeChart from "./TasksByAssigneeChart";
import OpenTasksChart from "./OpenTasksChart";
import CompletedThisWeek from "./CompletedThisWeek";
import TasksDuePanel from "./TasksDuePanel";
import LatestActivityPanel from "./LatestActivityPanel";
import { ProjectMember } from "@/hooks/useProjectMembers";
import { useWorkItems, WorkItem } from "@/hooks/useWorkItems";
import { useSprints } from "@/hooks/useSprints";
import { useSparkActivity } from "@/hooks/useSparkActivity";

type Props = {
  projectMembers?: ProjectMember[];
  projectId?: string | null;
};

const DashboardContent = ({ projectMembers = [], projectId }: Props) => {
  const { items: workItems, loading: workItemsLoading } = useWorkItems(projectId);
  const { sprints, loading: sprintsLoading } = useSprints(projectId);
  const { activity } = useSparkActivity(projectId || "");

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <DashboardTopBar />
      <DashboardEditBar />

      <div className="p-4 space-y-4">
        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AISummaryPanel workItems={workItems} sprints={sprints} />
          <StatsWorkloadPanel workItems={workItems} />
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TasksByAssigneeChart workItems={workItems} members={projectMembers} />
          <OpenTasksChart workItems={workItems} />
          <CompletedThisWeek workItems={workItems} />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <TasksDuePanel workItems={workItems} sprints={sprints} />
          </div>
          <LatestActivityPanel activity={activity} />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
