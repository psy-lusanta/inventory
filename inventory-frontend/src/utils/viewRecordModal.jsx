import AssetTagPrint from "../Asset Tag Printing/assetTagPrint";

export default function ViewRecordModal({ isOpen, onClose, row, columns }) {
  if (!isOpen || !row) return null;

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;

    return d.toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Record Details</h2>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          {columns.map((col) => (
            <div key={col.name}>
              <p className="text-xs text-gray-500 font-semibold">
                {col.name.replace(/_/g, " ").toUpperCase()}
              </p>
              <div className="border px-3 py-2 rounded-lg bg-gray-100">
                {col.name.endsWith("_at")
                  ? formatDate(row[col.name])
                  : row[col.name]}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <AssetTagPrint row={row} />
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 text-white rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
