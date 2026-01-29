import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Clock, Plus, Edit3, Trash2, FolderPlus, Folder } from "lucide-react";

function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode(token);
      const currentUser = decoded.username || "Someone";

      // Get current tables
      const tablesRes = await fetch(`${API_URL}/api/inventory/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!tablesRes.ok) return;
      const tablesData = await tablesRes.json();

      const currentTables = tablesData.tables.map((t) => ({
        name: t.table_name,
        display:
          t.display_name ||
          t.table_name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
      }));

      // Load previous state
      const prevStateStr = localStorage.getItem("activityPrevState");
      const prevState = prevStateStr
        ? JSON.parse(prevStateStr)
        : { tables: [] };
      const prevTables = prevState.tables || [];

      const allActions = [];

      // === Table Creation / Deletion Detection ===
      // Created tables
      currentTables.forEach((table) => {
        if (!prevTables.find((p) => p.name === table.name)) {
          allActions.push({
            type: "table-create",
            user: currentUser,
            description: `created new table "${table.display}"`,
            time: "Just now",
            timeRaw: Date.now(),
            icon: FolderPlus,
            color: "text-purple-500",
            bgColor: "bg-purple-100 dark:bg-purple-900/30",
          });
        }
      });

      // Deleted tables
      prevTables.forEach((table) => {
        if (!currentTables.find((c) => c.name === table.name)) {
          allActions.push({
            type: "table-delete",
            user: currentUser,
            description: `deleted table "${table.display}"`,
            time: "Just now",
            timeRaw: Date.now(),
            icon: Trash2,
            color: "text-red-500",
            bgColor: "bg-red-100 dark:bg-red-900/30",
          });
        }
      });

      // === Item Add/Edit Actions ===
      for (const table of currentTables) {
        try {
          const res = await fetch(
            `${API_URL}/api/inventory/tables/${table.name}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) continue;
          const data = await res.json();

          data.rows.forEach((row) => {
            const createdDate = row.created_at
              ? new Date(row.created_at)
              : null;
            const updatedDate = row.updated_at
              ? new Date(row.updated_at)
              : null;

            const latestDate =
              updatedDate && createdDate && updatedDate > createdDate
                ? updatedDate
                : createdDate;
            if (!latestDate) return;

            const isEdit =
              updatedDate && createdDate && updatedDate > createdDate;
            const user = isEdit
              ? row.updated_by || row.created_by || currentUser
              : row.created_by || currentUser;

            allActions.push({
              type: isEdit ? "edit" : "add",
              user,
              description: `${isEdit ? "updated" : "added"} ${
                row.item_name || row.asset_tag || "item"
              } in ${table.display}`,
              time: formatTimeAgo(latestDate),
              timeRaw: latestDate.getTime(),
              icon: isEdit ? Edit3 : Plus,
              color: isEdit ? "text-blue-500" : "text-emerald-500",
              bgColor: isEdit
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "bg-emerald-100 dark:bg-emerald-900/30",
            });
          });
        } catch (err) {
          console.error(`Failed to load ${table.name}`);
        }
      }

      // Sort newest first, take top 4
      allActions.sort((a, b) => b.timeRaw - a.timeRaw);
      setActivities(allActions.slice(0, 4));

      localStorage.setItem(
        "activityPrevState",
        JSON.stringify({
          tables: currentTables,
        })
      );
    } catch (err) {
      console.error("Failed to load activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();

    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };



  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Activity Feed
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recent actions in inventory
          </p>
        </div>
        <button
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium cursor-pointer"
          onClick={() => setShowActivities((prev) => !prev)}
        >
          {showActivities ? "Hide" : "Show"}
        </button>
      </div>

      <div className="p-6">
        {showActivities && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                No recent activity yet
              </p>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                      {activity.user}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentActivity;
