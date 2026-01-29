// components/dashboard/ConfigurableCategoryPie.jsx
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function DynamicPieChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const COLORS = [
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  useEffect(() => {
    async function fetchSelectedTables() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Get selected tables from localStorage
        let selected = JSON.parse(localStorage.getItem("chartTables") || "[]");

        if (selected.length === 0) {
          setChartData([]);
          setLoading(false);
          return;
        }

        // Fetch current valid tables to clean up deleted ones
        try {
          const tablesRes = await fetch(`${API_URL}/api/inventory/tables`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (tablesRes.ok) {
            const { tables } = await tablesRes.json();
            const validTableNames = new Set(tables.map((t) => t.table_name));

            // Remove deleted tables from selected
            const cleanedSelected = selected.filter((s) =>
              validTableNames.has(s.table_name)
            );

            if (cleanedSelected.length < selected.length) {
              localStorage.setItem(
                "chartTables",
                JSON.stringify(cleanedSelected)
              );
              selected = cleanedSelected;
            }
          }
        } catch (err) {
          console.error("Failed to fetch table list for cleanup:", err);
        }

        if (selected.length === 0) {
          setChartData([]);
          setLoading(false);
          return;
        }

        const distribution = [];

        for (const table of selected) {
          try {
            const res = await fetch(
              `${API_URL}/api/inventory/tables/${table.table_name}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (res.ok) {
              const data = await res.json();
              const count = data.rows?.length || 0;
              if (count > 0) {
                distribution.push({
                  name: table.display_name,
                  value: count,
                });
              }
            }
          } catch (err) {
            console.error(`Failed to load ${table.table_name}`);
          }
        }

        if (distribution.length === 0) {
          setChartData([]);
          setLoading(false);
          return;
        }

        distribution.sort((a, b) => b.value - a.value);
        setChartData(distribution);
      } catch (err) {
        console.error("Failed to load chart:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSelectedTables();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 text-center">
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          No tables selected for chart
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-300 mt-2">
          Right-click tables in sidebar → "Show in Category Chart"
        </p>
      </div>
    );
  }

  const totalItems = chartData
    .filter((item) => item.value > 0)
    .reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          Category Distribution
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-300">
          {chartData.length} active table{chartData.length !== 1 ? "s" : ""} •{" "}
          {totalItems.toLocaleString()} item{totalItems !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "none",
                borderRadius: "12px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "white", fontWeight: "bold" }} // for optional label
              itemStyle={{ color: "white" }} 
              formatter={(value) =>
                `${value} items (${((value / totalItems) * 100).toFixed(1)}%)`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-3">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-slate-300 dark:text-slate-200">
                {item.name}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200 dark:text-slate-100">
              {((item.value / totalItems) * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DynamicPieChart;
