import { Trash2 } from "lucide-react";

export default function DeleteRecordModal({
  isOpen,
  onClose,
  row,
  tableName,
  onDelete,
}) {
  if (!isOpen || !row) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl text-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="">
            <Trash2 className="text-black-600" size={30} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Delete Record
          </h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this record?
          <br />
          <span className="font-semibold text-gray-800">
            Asset Tag: {row.asset_tag}
          </span>
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onDelete(row);
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
