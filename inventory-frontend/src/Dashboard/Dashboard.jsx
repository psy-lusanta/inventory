import { useEffect, useState } from "react";
import DynamicStatsGrid from "./DynamicStatsGrid";
import ChartSection from "./ChartSection";
import TableSection from "./TableSection";
import RecentActivity from "./RecentActivity";

function Dashboard() {

  return (
    <div className="space-y-6 overflow-visible">
      <DynamicStatsGrid /> {/*Summary stats*/}
      <ChartSection /> {/*For Bar Graphs and Pie Charts*/}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TableSection /> {/*Table Section*/}
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
