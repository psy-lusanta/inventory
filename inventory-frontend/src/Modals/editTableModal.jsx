import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
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
            .replace(/\b\w/g, (c) => c.toUpperCase()),
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
            },
          );

          if (!submenuRes.ok) {
            console.warn("Submenu label update failed, but table renamed");
          }
        }

        toast.success("Table renamed successfully");
      }

      const metaPayload = {
        table_name: newRawName !== oldRawName ? newRawName : oldRawName,
        display_name: newDisplayName,
        icon,
      };

      if (hasColumnChanges) {
        // Send columns to structure update
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
          },
        );

        if (!structureRes.ok) {
          const errData = await structureRes.json();
          throw new Error(errData.error || "Structure update failed");
        }

        toast.success("Columns updated");
      } else {
        // Only metadata
        const metaRes = await fetch(
          `${API_URL}/api/inventory/update-table-meta`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(metaPayload),
          },
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Edit Table
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Icon */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Icon
          </label>
          <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <IconPreview className="w-6 h-6" />
            <span className="text-sm">{icon}</span>
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Table Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
            disabled={loading}
          />
        </div>

        {/* Columns */}
        {!hasSubmenus ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Columns
            </label>
            <div className="space-y-3">
              {columns.map((col, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) =>
                      updateColumn(index, "name", e.target.value)
                    }
                    placeholder="Column name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    disabled={loading}
                  />
                  <select
                    value={col.type}
                    onChange={(e) =>
                      updateColumn(index, "type", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    disabled={loading}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <button
                    onClick={() => removeColumn(index)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addColumn}
              className="w-full py-2 bg-gray-200 dark:bg-slate-700 rounded-lg mt-4 hover:bg-gray-300"
              disabled={loading}
            >
              + Add Column
            </button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This table has submenus. Column editing is disabled.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-slate-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
