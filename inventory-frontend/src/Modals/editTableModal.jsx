import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function EditTableModal({
  isOpen,
  tableData,
  onClose,
  onSave,
  onSuccess,
}) {
  if (!isOpen || !tableData) return null;

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [displayName, setDisplayName] = useState("");
  const [icon, setIcon] = useState("NotebookText");
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSubTable = tableData?.isSubTable || false;
  const submenuPath = tableData?.submenuPath;
  const parentTableName = tableData?.parentTableName;
  const tableName = tableData?.table_name || "";

  const SYSTEM_COLUMNS = new Set([
    "asset_tag",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "status",
  ]);

  const hasSubmenus = tableData.hasSubmenus || false;

  useEffect(() => {
    if (tableData) {
      setDisplayName(
        tableData.display_name ||
          tableData.table_name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
      );
      setIcon(tableData.icon || "NotebookText");

      const rawColumns = tableData.columns || [];
      const customColumns = rawColumns
        .filter((col) => !SYSTEM_COLUMNS.has(col.name?.toLowerCase()))
        .map((col) => ({
          name: col.name || "",
          type: col.type || "text",
        }));
      setColumns(customColumns);
    }
  }, [tableData]);

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "text" }]);
  };

  const updateColumn = (index, field, value) => {
    const updated = [...columns];
    updated[index][field] = value;
    setColumns(updated);
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    const newDisplayName = displayName.trim();
    if (!newDisplayName) {
      toast.error("Display name is required");
      setLoading(false);
      return;
    }

    const newRawName = newDisplayName.toLowerCase().replace(/\s+/g, "_");
    const oldRawName = tableName;

    const hasColumnChanges = columns.some((col) => col.name.trim());

    try {
      // Rename table if name changed
      if (newRawName !== oldRawName) {
        const checkRes = await fetch(`${API_URL}/api/inventory/tables`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!checkRes.ok) throw new Error("Check failed");
        const { tables } = await checkRes.json();
        if (tables.some((t) => t.table_name === newRawName)) {
          toast.error(`Name "${newDisplayName}" already in use`);
          setLoading(false);
          return;
        }

        const renameRes = await fetch(`${API_URL}/api/inventory/rename-table`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            old_name: oldRawName,
            new_name: newRawName,
            oldDisplayName: tableData.display_name || oldRawName,
            newDisplayName,
          }),
        });

        if (!renameRes.ok) {
          const errData = await renameRes.json();
          throw new Error(errData.error || "Rename failed");
        }

        if (isSubTable) {
          const submenuRes = await fetch(
            `${API_URL}/api/inventory/update-submenu-label`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                parent_table_name: parentTableName,
                submenu_path: submenuPath,
                new_submenu_path: `/inventory/table/${newRawName}`,
                new_label: newDisplayName,
              }),
            }
          );

          if (!submenuRes.ok) {
            console.warn("Submenu label update failed, but table renamed");
          }
        }

        toast.success("Table renamed successfully");
      }

      // Update metadata or structure
      const metaPayload = {
        table_name: newRawName !== oldRawName ? newRawName : oldRawName,
        display_name: newDisplayName,
        icon,
      };

      if (hasColumnChanges) {
        const structureRes = await fetch(
          `${API_URL}/api/inventory/update-table-structure/${newRawName !== oldRawName ? newRawName : oldRawName}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              displayName: newDisplayName,
              icon,
              columns,
            }),
          }
        );

        if (!structureRes.ok) {
          const errData = await structureRes.json();
          throw new Error(errData.error || "Structure update failed");
        }

        toast.success("Columns updated");
      } else {
        const metaRes = await fetch(
          `${API_URL}/api/inventory/update-table-meta`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(metaPayload),
          }
        );

        if (!metaRes.ok) throw new Error("Metadata update failed");

        toast.success("Settings updated");
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      console.error("Edit error:", err);
      toast.error(err.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const IconPreview = Icons[icon] || Icons.NotebookText;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-slate-900 z-10 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Edit Table: {tableName}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X size={28} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Icon
            </label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <IconPreview className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-medium text-slate-800 dark:text-slate-200">
                {icon}
              </span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* Columns Section */}
        {!hasSubmenus ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold text-slate-800 dark:text-white">
                Custom Columns
              </label>
              <button
                onClick={() => setColumns([...columns, { name: "", type: "text" }])}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                + Add Column
              </button>
            </div>

            {/* Responsive column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {columns.map((col, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col gap-3"
                >
                  {/* Column Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Column Name
                    </label>
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => updateColumn(index, "name", e.target.value)}
                      placeholder="Column name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      disabled={loading}
                    />
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeColumn(index)}
                    disabled={loading}
                    className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors self-start"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {columns.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 mt-6">
                No custom columns yet. Click "Add Column" to start.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-center text-blue-800 dark:text-blue-200 font-medium">
              This table has submenus. Column editing is disabled.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}