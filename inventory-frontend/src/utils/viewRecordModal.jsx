import AssetTagPrint from "../Asset Tag Printing/assetTagPrint";
import { X } from "lucide-react";

function ViewRecordModal({ isOpen, onClose, row, columns }) {
  if (!isOpen || !row) return null;

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value; // fallback if invalid date
    return d.toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const displayColumns = columns.filter(
    (col) => ![].includes(col.name.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between text-white">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Record Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body - responsive grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayColumns.map((col) => {
              const value = row[col.name];
              let displayValue = value ?? "—";

              if (col.name.toLowerCase() === "created_at" || col.name.toLowerCase() === "updated_at") {
                displayValue = formatDate(value);
              }

              if (col.name.toLowerCase() === "created_by" && !value || col.name.toLowerCase() === "updated_by" && !value) {
                displayValue = "Unknown";
              }

              return (
                <div key={col.name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {col.name.replace(/_/g, " ").toUpperCase()}
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100">
                    {displayValue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
          <AssetTagPrint row={row} />

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewRecordModal;