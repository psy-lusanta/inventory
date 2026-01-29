// components/Modals/DeleteSubmenuModal.jsx
import { useState } from "react";

export default function DeleteSubmenuModal({
  isOpen,
  onClose,
  submenuName,
  parentName,
  onConfirm,
  isDeleting = false,
}) {
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      await onConfirm();  
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Delete Submenu?
        </h2>

        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Are you sure you want to delete the submenu{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            "{submenuName}"
          </span>{" "}
          under{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            "{parentName}"
          </span>
          ?
        </p>

        <p className="text-sm text-red-600 dark:text-red-400 mb-8 font-medium">
          This will permanently delete the submenu and all its data. This action
          cannot be undone.
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Deleting...
              </>
            ) : (
              "Delete Submenu"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
