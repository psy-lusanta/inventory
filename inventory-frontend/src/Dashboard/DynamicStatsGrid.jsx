// components/dashboard/DynamicStatsGrid.jsx
import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { ArrowUpRight, ArrowDownRight, X } from "lucide-react";

function DynamicStatsGrid() {
  const [pinnedTables, setPinnedTables] = useState([]);
  const [stats, setStats] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      try {
        const decoded = jwtDecode(currentToken);
        setIsAdmin(decoded.role?.toLowerCase() === "administrator");
      } catch (e) {
        console.error("Invalid token:", e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const loadPinnedStats = async () => {
      let pinned = JSON.parse(localStorage.getItem("pinnedTables") || "[]");

      // Fetch current valid tables from backend
      try {
        const res = await fetch(`${API_URL}/api/inventory/tables`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) {
          const { tables } = await res.json();
          const validTableNames = new Set(tables.map((t) => t.table_name));

          // Filter out pinned tables that no longer exist
          const cleanedPinned = pinned.filter((p) =>
            validTableNames.has(p.table_name)
          );

          // Update localStorage if we removed any
          if (cleanedPinned.length < pinned.length) {
            localStorage.setItem("pinnedTables", JSON.stringify(cleanedPinned));
            pinned = cleanedPinned;
          }
        }
      } catch (err) {
        console.error("Failed to fetch table list for cleanup:", err);
      }

      setPinnedTables(pinned);

      // Fetch stats for remaining pinned tables
      if (pinned.length === 0) {
        setStats([]);
        return;
      }

      const statsData = await Promise.all(
        pinned.map(async (table) => {
          try {
            const res = await fetch(
              `${API_URL}/api/inventory/tables/${table.table_name}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (!res.ok) return null; // Skip if table gone (extra safety)

            const data = await res.json();
            const count = data.rows?.length || 0;

            // Mock trend (replace with real later)
            const lastMonthCount = Math.floor(count * 0.9 + Math.random() * 10);
            const percentChange =
              lastMonthCount > 0
                ? Math.round(((count - lastMonthCount) / lastMonthCount) * 100)
                : 100;

            return {
              ...table,
              count,
              changePercent: Math.abs(percentChange),
              trend: count >= lastMonthCount ? "up" : "down",
            };
          } catch (err) {
            console.error(`Failed to load ${table.table_name}:`, err);
            return null;
          }
        })
      );

      setStats(statsData.filter(Boolean));
    };

    loadPinnedStats();
  }, []);

  const getIcon = (iconName) => {
    const Icon = Icons[iconName] || Icons.NotebookText;
    return <Icon className="w-7 h-7" />;
  };

  if (stats.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 text-center border border-slate-200/50 dark:border-slate-700/50">
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
          No tables pinned yet
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Right-click any table in the sidebar and select "Pin to Dashboard" to
          highlight it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const IconComponent = Icons[stat.icon] || Icons.NotebookText;

        return (
          <div
            key={stat.table_name}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 relative group"
          >
            {isAdmin && (
              <button
                title="Unpin from dashboard"
                onClick={(e) => {
                  e.stopPropagation();
                  const pinned = JSON.parse(
                    localStorage.getItem("pinnedTables") || "[]"
                  );
                  const updated = pinned.filter(
                    (p) => p.table_name !== stat.table_name
                  );
                  localStorage.setItem("pinnedTables", JSON.stringify(updated));
                  setStats((prev) =>
                    prev.filter((s) => s.table_name !== stat.table_name)
                  );
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 
               bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm 
               rounded-full p-1.5 
               border border-slate-300 dark:border-slate-600 
               hover:bg-red-500 hover:border-red-500 
               hover:text-white 
               text-slate-500 dark:text-slate-400 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.display_name}
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
                  {stat.count.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <IconComponent className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {stat.trend === "up" ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {stat.changePercent}%
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                vs last month
              </span>
            </div>

            <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  stat.trend === "up"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                    : "bg-gradient-to-r from-orange-500 to-red-600"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.abs(parseInt(stat.changePercent)) + 50
                  )}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DynamicStatsGrid;
