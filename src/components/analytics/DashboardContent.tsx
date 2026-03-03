import DashboardTopBar from "./DashboardTopBar";
import DashboardEditBar from "./DashboardEditBar";
import AISummaryPanel from "./AISummaryPanel";
import StatsWorkloadPanel from "./StatsWorkloadPanel";
import TasksByAssigneeChart from "./TasksByAssigneeChart";
import OpenTasksChart from "./OpenTasksChart";
import CompletedThisWeek from "./CompletedThisWeek";
import TasksDuePanel from "./TasksDuePanel";
import LatestActivityPanel from "./LatestActivityPanel";

const DashboardContent = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <DashboardTopBar />
      <DashboardEditBar />

      <div className="p-4 space-y-4">
        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AISummaryPanel />
          <StatsWorkloadPanel />
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TasksByAssigneeChart />
          <OpenTasksChart />
          <CompletedThisWeek />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <TasksDuePanel />
          </div>
          <LatestActivityPanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
