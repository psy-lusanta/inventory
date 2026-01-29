import { useState, useEffect } from "react";

export default function EditRecordModal({
  isOpen,
  onClose,
  row,
  columns,
  onSave,
}) {
  const hiddenColumns = [
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  const editableColumns = columns.filter(
    (c) =>
      !hiddenColumns.includes(c.name.toLowerCase())
  );

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (row) setFormData(row);
  }, [row]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Edit Record</h2>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {row &&
            editableColumns.map((col) => (
              <div key={col.name}>
                <label className="block text-sm font-semibold mb-1">
                  {col.name.replace(/_/g, " ").toUpperCase()}
                </label>

                {col.name === "status" ? (
                  <select
                    value={formData.status ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        status: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Available">Available</option>
                    <option value="Deployed">Deployed</option>
                    <option value="Defective">Defective</option>
                  </select>
                ) : (
                  <input
                    value={formData[col.name] ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        [col.name]: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                )}
              </div>
            ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer" 
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
