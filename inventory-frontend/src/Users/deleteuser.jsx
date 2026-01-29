import { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeleteUserButton({ row, onDelete }) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    fetch(`http://localhost:5000/users/${row.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete user");
        onDelete(row.id);
        setOpen(false);
        toast.success("User deleted successfully");
      })
      .catch((err) => {
        console.error("Delete error:", err);
        toast.error("Failed to delete user ");
      });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer"
      >
        <Trash2 size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          ></div>

          <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-sm w-full z-10">
            <h2 className="text-lg font-semibold text-gray-800">
              Are you sure?
            </h2>
            <p className="text-gray-600 mt-2">
              Do you really want to delete this user? This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

