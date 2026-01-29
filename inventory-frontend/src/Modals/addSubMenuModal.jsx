// Modals/AddSubTableModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";

function AddSubTableModal({
  isOpen,
  onClose,
  onCreate,
  parentName,
  initialData,
}) {
  const [tableName, setTableName] = useState(initialData?.displayName || "");
  const [columns, setColumns] = useState(
    initialData?.columns.length > 0
      ? initialData.columns
      : [{ name: "", type: "text" }]
  );

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "text" }]);
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index, field, value) => {
    const updated = [...columns];
    updated[index][field] = value;
    setColumns(updated);
  };

  const handleSubmit = () => {
    if (!tableName.trim()) return alert("Sub-table name is required");

    let validColumns = columns.filter((col) => col.name.trim());
    if (validColumns.length === 0) {
      validColumns = [{ name: "description", type: "text" }];
    }

    onCreate({
      tableName:
        initialData?.tableName ||
        tableName.trim().toLowerCase().replace(/\s+/g, "_"),
      displayName: tableName.trim(),
      columns: validColumns,
    });

    onClose();
  };

  useEffect(() => {
    if (isOpen && initialData) {
      setTableName(initialData.displayName || "");
      setColumns(
        initialData.columns.length > 0
          ? initialData.columns.map((col) => ({
              name: col.name,
              type: col.type || "text",
            }))
          : [{ name: "", type: "text" }]
      );
    } else if (isOpen && !initialData) {
      // Create mode
      setTableName("");
      setColumns([{ name: "", type: "text" }]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {initialData ? "Edit Sub-Table" : "Create Sub-Table"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Under parent: <span className="font-semibold">{parentName}</span>
        </p>

        <input
          type="text"
          placeholder="Sub-table name (e.g. Production, Backup)"
          className="w-full px-4 py-3 border text-amber-50 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />

        <div className="space-y-3 mb-4">
          <h3 className="font-medium text-slate-700">Columns</h3>
          {columns.map((col, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Column name"
                className="flex-1 px-3 py-2 border rounded-lg text-amber-50"
                value={col.name}
                onChange={(e) => updateColumn(index, "name", e.target.value)}
              />
              <select
                value={col.type}
                onChange={(e) => updateColumn(index, "type", e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
              </select>
              {columns.length > 1 && (
                <button
                  onClick={() => removeColumn(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addColumn}
          className="w-full py-2 bg-gray-200 dark:bg-slate-700 rounded-lg mb-6 hover:bg-gray-300"
        >
          + Add Column
        </button>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700"
          >
            {initialData ? "Save Changes" : "Create Sub-Table"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddSubTableModal;
