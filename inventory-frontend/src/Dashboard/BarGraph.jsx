// components/dashboard/ItemsAddedChart.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ItemsAddedChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchAllItems() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const tablesRes = await fetch(`${API_URL}/api/inventory/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tablesRes.ok) throw new Error("Failed to fetch tables");
        const tablesData = await tablesRes.json();
        const tableNames = tablesData.tables.map(t => t.table_name);

        const allRecords = [];
        for (const tableName of tableNames) {
          const res = await fetch(`${API_URL}/api/inventory/tables/${tableName}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            data.rows.forEach(row => {
              if (row.created_at) {
                allRecords.push({
                  created_at: row.created_at,
                  table: tableName,
                });
              }
            });
          }
        }

        const monthlyCount = {};
        allRecords.forEach(record => {
          const date = new Date(record.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
        });

        const last12Months = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const monthName = d.toLocaleString("default", { month: "short" });
          last12Months.push({
            month: monthName,
            count: monthlyCount[key] || 0,
          });
        }

        setChartData(last12Months);
      } catch (err) {
        console.error("Failed to load chart data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllItems();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-center">
        <p className="text-slate-600 dark:text-slate-400">Loading chart...</p>
      </div>
    );
  }

  if (chartData.every(d => d.count === 0)) {
    return (
      <div className="p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-center">
        <p className="text-slate-600 dark:text-slate-400">No items added yet</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          Items Added Over Time
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total new items per month (last 12 months)
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [value, "Items Added"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: "#8b5cf6", r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ItemsAddedChart;