import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function NewTableInputModal({
  isOpen,
  onClose,
  columns,
  onSubmit,
}) {
  if (!isOpen) return null;

  const hiddenColumns = [
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  const visibleColumns = columns.filter(
    (col) => !hiddenColumns.includes(col.name.toLowerCase())
  );

  const [formData, setFormData] = useState({});

  const handleChange = (col, value) => {
    setFormData((prev) => ({
      ...prev,
      [col]: value,
    }));
  };

  const handleSave = () => {
    onSubmit(formData);
    onClose();
  };

  return (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Add New Record
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X size={24} className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visibleColumns.map((col) => (
          <div key={col.name} className="flex flex-col">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {col.name.replace(/_/g, " ").toUpperCase()}
            </label>

            {col.name.toLowerCase() === "status" ? (
              <select
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData[col.name] || "Available"}
                onChange={(e) => handleChange(col.name, e.target.value)}
              >
                <option value="Available">Available</option>
                <option value="Deployed">Deployed</option>
                <option value="Defective">Defective</option>
              </select>
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData[col.name] || ""}
                onChange={(e) => handleChange(col.name, e.target.value)}
                placeholder={`Enter ${col.name.replace(/_/g, " ")}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
        >
          Save Record
        </button>
      </div>
    </div>
  </div>
);
}
