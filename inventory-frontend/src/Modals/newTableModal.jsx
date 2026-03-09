import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as Icons from "lucide-react";
import { X, Search } from "lucide-react";

function NewTableModal({ isOpen, onClose, onCreate }) {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState([{ name: "", type: "text" }]);
  const [selectedIcon, setSelectedIcon] = useState(null);

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconList, setIconList] = useState([]);
  const [iconSearch, setIconSearch] = useState(""); 

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

  const filteredIcons = iconList.filter((iconName) =>
    iconName.toLowerCase().includes(iconSearch.toLowerCase().trim())
  );

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

        <button
          className="w-full py-2 mb-4 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
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

        <input
          type="text"
          className="w-full p-2 mt-1 mb-4 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
          placeholder="Table Name"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />

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
              <button
                className="px-3 py-3 bg-red-500 text-white rounded-full cursor-pointer"
                onClick={() => removeColumn(index)}
              >
                <X size={16} />
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

      {iconPickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Pick an Icon
              </h3>
              <button
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={() => setIconPickerOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search icons"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {filteredIcons.length > 0 ? (
                  filteredIcons.map((iconName) => {
                    const IconComponent = Icons[iconName];
                    if (!IconComponent) return null;

                    return (
                      <button
                        key={iconName}
                        className={`p-3 dark:text-slate-400 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                          selectedIcon === iconName
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-200 dark:border-slate-600"
                        }`}
                        onClick={() => {
                          setSelectedIcon(iconName);
                          setIconPickerOpen(false);
                        }}
                      >
                        <IconComponent size={22} className="mx-auto" />
                        <p className="text-xs mt-1 text-center truncate dark:text-slate-400">
                          {iconName}
                        </p>
                      </button>
                    );
                  })
                ) : (
                  <p className="col-span-full text-center text-gray-500 py-10">
                    No icons found for "{iconSearch}"
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                onClick={() => setIconPickerOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewTableModal;