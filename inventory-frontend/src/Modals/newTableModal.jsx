import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as Icons from "lucide-react";
import { X } from "lucide-react";

function NewTableModal({ isOpen, onClose, onCreate }) {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState([{ name: "", type: "text" }]);
  const [selectedIcon, setSelectedIcon] = useState(null);

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconList, setIconList] = useState([]);

  useEffect(() => {
    if (iconPickerOpen && iconList.length === 0) {
      fetch("http://localhost:5000/api/icons", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Icon API returned error");
          return res.json();
        })
        .then((data) => setIconList(data))
        .catch((err) => console.error("Icon load error:", err));
    }
  }, [iconPickerOpen]);

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "text" }]);
  };

  const removeColumn = (index) => {
    const updated = [...columns];
    updated.splice(index, 1);
    setColumns(updated);
  };

  const updateColumn = (index, field, value) => {
    const updated = [...columns];
    updated[index][field] = value;
    setColumns(updated);
  };

  const handleSubmit = () => {
    if (!tableName.trim()) return toast.error("Table name is required");

    const validColumns = columns.filter((col) => col.name.trim() !== "");

    if (validColumns.length === 0) {
      return toast.error("Add at least 1 column");
    }

    onCreate({
      tableName: tableName.trim(),
      icon: selectedIcon,
      columns: validColumns,
    });

    onClose();
    setTableName("");
    setColumns([{ name: "", type: "text" }]);
    setSelectedIcon(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-[500px] relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Create New Table
        </h2>

        {/* ICON PICKER BUTTON */}
        <button
          className="w-full py-2 mb-4 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer "
          onClick={() => setIconPickerOpen(true)}
        >
          {selectedIcon &&
            Icons[selectedIcon] &&
            (() => {
              const IconComponent = Icons[selectedIcon];
              return <IconComponent size={20} />;
            })()}
          {selectedIcon || "Pick Icon"}
        </button>

        {/* TABLE NAME */}
        <input
          type="text"
          className="w-full p-2 mt-1 mb-4 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
          placeholder="Table Name"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />

        {/* COLUMN BUILDER */}
        <div className="space-y-3 max-h-64 overflow-auto pr-2">
          {columns.map((col, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Column name"
                className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                value={col.name}
                onChange={(e) => updateColumn(index, "name", e.target.value)}
              />
              <select
                value={col.type}
                onChange={(e) => updateColumn(index, "type", e.target.value)}
                className="p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
              </select>
              <button
                className="px-3 py-2 bg-red-500 text-white rounded-lg cursor-pointer"
                onClick={() => removeColumn(index)}
              >
                X
              </button>
            </div>
          ))}
        </div>

        <button
          className="w-full mt-3 py-2 bg-green-500 text-white rounded-lg cursor-pointer"
          onClick={addColumn}
        >
          Add Column
        </button>

        {/* LIVE TABLE PREVIEW */}
        {columns.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl shadow-sm">
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-t-xl space-x-2">
              {selectedIcon &&
                Icons[selectedIcon] &&
                (() => {
                  const IconComponent = Icons[selectedIcon];
                  return <IconComponent size={20} />;
                })()}
              <span className="font-bold">{tableName || "Table Preview"}</span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-left text-sm font-semibold text-gray-700"
                    >
                      {col.name || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {columns.map((col, index) => (
                    <td key={index} className="px-4 py-2 text-sm text-gray-600">
                      {col.type}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer"
            onClick={handleSubmit}
          >
            Create Table
          </button>
        </div>
      </div>

      {/* ICON PICKER MODAL */}
      {iconPickerOpen && (
        <div className=" custom-scrollbar fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl w-[600px] max-h-[500px] overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Pick an Icon
              </h3>

              <button className="p-0.5 bg-red-400 rounded-full text-black cursor-pointer" onClick={() => setIconPickerOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {iconList.map((iconName) => {
                const IconComponent = Icons[iconName];
                if (!IconComponent) return null;

                return (
                  <button
                    key={iconName}
                    className="p-3 border rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => {
                      setSelectedIcon(iconName);
                      setIconPickerOpen(false);
                    }}
                  >
                    <IconComponent size={22} className="mx-auto text-blue-100" />
                    <p className="text-xs mt-1 text-center truncate text-blue-100">
                      {iconName}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg cursor-pointer"
              onClick={() => setIconPickerOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewTableModal;
