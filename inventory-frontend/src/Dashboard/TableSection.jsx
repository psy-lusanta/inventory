// components/dashboard/TableSection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TableSection() {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(true);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchRecentItems() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Get all tables
        const tablesRes = await fetch(`${API_URL}/api/inventory/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tablesRes.ok) throw new Error("Failed to fetch tables");
        const tablesData = await tablesRes.json();

        const allItems = [];

        for (const table of tablesData.tables) {
          try {
            const res = await fetch(`${API_URL}/api/inventory/tables/${table.table_name}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) continue;

            const data = await res.json();
            const displayName = table.display_name || table.table_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

            data.rows.forEach(row => {
              allItems.push({
                table_name: table.table_name,
                table_display: displayName,
                asset_tag: row.asset_tag || "N/A",
                status: row.status || "Unknown",
                added_by: row.created_by || "Unknown",
                date: row.created_at,
              });
            });
          } catch (err) {
            console.error(`Failed to load ${table.table_name}`);
          }
        }

        allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentItems(allItems.slice(0, 4)); 

      } catch (err) {
        console.error("Failed to load recent items:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentItems();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
      case "Completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Deployed":
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Defective":
      case "Cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
        <p className="text-center text-slate-600 dark:text-slate-400">Loading recent activity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Recents
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Latest items across all tables
              </p>
            </div>
            <button
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-bold cursor-pointer"
              onClick={() => setShowTable((prev) => !prev)}
            >
              {showTable ? "Hide Table" : "Show Table"}
            </button>
          </div>
        </div>

        {showTable && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 text-sm font-bold text-slate-800 dark:text-white">
                    Table
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-slate-800 dark:text-white">
                    Asset Tag
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-slate-800 dark:text-white">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-slate-800 dark:text-white">
                    Added by
                  </th>
                  <th className="text-left p-4 text-sm font-bold text-slate-800 dark:text-white">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No recent items yet
                    </td>
                  </tr>
                ) : (
                  recentItems.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => navigate(`/inventory/table/${item.table_name}`)}
                      className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-sm font-medium text-slate-800 dark:text-white">
                        {item.table_display}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.asset_tag}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.added_by || "Unknown"}
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(item.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableSection;