// pages/Reports.jsx
import { useState, useEffect } from "react";
import { AlertTriangle, Wrench, Clock, Download } from "lucide-react";
import toast from "react-hot-toast";

function Reports() {
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


  const exportReport = () => {
    const csvContent = [
      ["Asset Tag", "Item Name", "Table", "Status", "Last Updated"],
      ...maintenanceItems.map(item => [
        item.asset_tag || "N/A",
        item.item_name || "Unnamed",
        item.table_name || "Unknown",
        item.status || "Maintenance Due",
        new Date(item.updated_at).toLocaleDateString(),
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "maintenance-report.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Report exported as CSV");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Reports & Insights
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Overview of inventory status and maintenance needs
          </p>
        </div>

        <button
          onClick={exportReport}
          disabled={loading || maintenanceItems.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Maintenance Due Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold">Items For Maintenance</h2>
              <p className="text-amber-100 text-sm mt-1">
                Items that require attention (status: Maintenance Due / Overdue)
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            Loading maintenance report...
          </div>
        ) : maintenanceItems.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench size={48} className="mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
              All Clear!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              No items currently need maintenance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Asset Tag
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Item Name
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Table
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {maintenanceItems.map((item) => (
                  <tr
                    key={item.asset_tag}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-8 py-5 font-medium text-slate-900 dark:text-white">
                      {item.asset_tag || "N/A"}
                    </td>
                    <td className="px-8 py-5 text-slate-700 dark:text-slate-300">
                      {item.item_name || "Unnamed Item"}
                    </td>
                    <td className="px-8 py-5 text-slate-700 dark:text-slate-300">
                      {item.table_name || "Unknown"}
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        {item.status || "Maintenance Due"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-600 dark:text-slate-400">
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Placeholder Sections for Future */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
            <Clock size={24} className="text-indigo-500" />
            Recent Activity
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Coming soon: Last 30 days of adds, updates, and deletes.
          </p>
        </div>

        {/* Export All */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
            <Download size={24} className="text-emerald-500" />
            Full Inventory Export
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Download all tables as CSV or Excel.
          </p>
          <button
            disabled
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl opacity-50 cursor-not-allowed"
          >
            Export All Data (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;