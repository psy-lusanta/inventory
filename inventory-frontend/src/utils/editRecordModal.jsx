import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditRecordModal({
  isOpen,
  onClose,
  row,
  columns,
  onSave,
}) {
  if (!isOpen || !row) return null;

  const hiddenColumns = ["created_at", "created_by", "updated_at", "updated_by"];
  const editableColumns = columns.filter(
    (c) => !hiddenColumns.includes(c.name.toLowerCase())
  );

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (row) setFormData(row);
  }, [row]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between text-white">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Record</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Body - responsive grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {editableColumns.map((col) => (
              <div key={col.name} className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {col.name.replace(/_/g, " ").toUpperCase()}
                </label>

                {col.name.toLowerCase() === "status" ? (
                  <select
                    value={formData[col.name] ?? "Available"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [col.name]: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Deployed">Deployed</option>
                    <option value="Defective">Defective</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData[col.name] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [col.name]: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}