import React, { useState, useEffect } from "react";

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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Add Record </h2>

        <div className="space-y-4">
          {visibleColumns.map((col) => (
            <div key={col.name}>
              <label className="block font-medium mb-1">
                {col.name.replace(/_/g, " ").toUpperCase()}
              </label>

              {col.name === "status" ? (
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  value={formData.status || "Available"}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="TESTING">Available</option>
                  <option value="Deployed">Deployed</option>
                  <option value="Defective">Defective</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  value={formData[col.name] || ""}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
