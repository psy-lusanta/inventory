import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import * as Icons from "lucide-react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  BookCheck,
  Edit3,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import NewTableInputModal from "../Modals/newTableInputModal.jsx";
import ViewRecordModal from "./viewRecordModal.jsx";
import EditRecordModal from "./editRecordModal.jsx";
import DeleteRecordModal from "./deleteRecordModal.jsx";

function DynamicTablePage() {
  const { tableName } = useParams();
  const { triggerAppReload } = useOutletContext();

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [items, setItems] = useState([]);
  const [displayName, setDisplayName] = useState(tableName);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const rowsPerPage = 8;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [originalAssetTag, setOriginalAssetTag] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(1);

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iconName, setIconName] = useState(null);

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [visibleColumnNames, setVisibleColumnNames] = useState([]);

  const dropdownRef = useRef(null);

  const IconComponent = iconName ? Icons[iconName] : null;

  const STORAGE_KEY = `visible_columns_${tableName}`;

  const currentTableDisplayName =
    displayName ||
    tableName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const loadTable = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inventory/tables/${tableName}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch table");
      const data = await res.json();

      const formatted =
        data.displayName ||
        tableName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      setDisplayName(formatted);
      setIconName(data.icon || "NotebookText");
      setColumns(data.columns || []);
      setRows(data.rows || []);
      setItems(data.rows || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load table");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTable();
  }, [tableName]);

  const hiddenColumns = [
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  const allColumns = useMemo(() => {
    if (!rows.length) return [];

    return Object.keys(rows[0]).filter((col) => !col.endsWith("_at"));
  }, [rows]);

  const filteredData = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (row) => row.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return filtered;
  }, [rows, searchTerm, statusFilter]);

  const formatStatus = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formattedTitle =
    tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase();

  function formatColumnName(col) {
    return col.replace(/_/g, " ");
  }

  const visibleColumns = columns.filter(
    (col) =>
      visibleColumnNames.includes(col.name) &&
      !hiddenColumns.includes(col.name.toLowerCase())
  );

  useEffect(() => {
    if (!columns.length) return;

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setVisibleColumnNames(JSON.parse(saved));
    } else {
      const defaults = columns
        .map((c) => c.name)
        .filter(
          (name) =>
            !name.endsWith("_at") && !name.endsWith("_by") && name !== "status"
        );

      setVisibleColumnNames(defaults);
    }
  }, [columns, tableName]);

  useEffect(() => {
    if (visibleColumnNames.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumnNames));
    }
  }, [visibleColumnNames]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowColumnToggle(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getColorStatus = (status) => {
    const statusColors = {
      Available: "bg-blue-100 text-blue-800",
      Deployed: "bg-green-100 text-green-800",
      Defective: "bg-red-100 text-red-800",
    };

    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const paginatedTable = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return (
      <div className="p-10 text-center text-xl text-white">
        Loading {displayName}...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              {IconComponent && (
                <IconComponent size={28} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{displayName}</h2>
              <p className="text-indigo-100 text-sm">Manage {displayName}</p>
            </div>
          </div>
          <div className="text-white">
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <BookCheck size={16} />
              <span className="font-semibold">{rows.length}</span>
              <span className="text-indigo-100">Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center gap-4">
        <div className="mt-4">
          <button
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow active:scale-95 cursor-pointer"
            onClick={() => setIsInputModalOpen(true)}
          >
            <Plus size={18} />
            <span>Add Record</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={`Search ${displayName}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 w-full sm:w-80 bg-white shadow-md"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              {visibleColumns
                .filter((c) => c.name !== "status")
                .map((col) => (
                  <th
                    key={col.name}
                    className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider"
                  >
                    {formatColumnName(col.name)}
                  </th>
                ))}

              <th className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                STATUS
              </th>

              {/* ACTION column — with toggle button */}
              <th className="px-8 py-5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider relative">
                <div className="flex items-center justify-center gap-3">
                  <span>ACTION</span>
                  <button
                    onClick={() => setShowColumnToggle((prev) => !prev)}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                </div>

                {showColumnToggle &&
                  createPortal(
                    <div
                      className="fixed inset-0 z-50"
                      onClick={() => setShowColumnToggle(false)}
                    >
                      <div
                        className="absolute top-48 right-8 w-64 bg-white shadow-2xl rounded-lg border border-gray-200 p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">
                          Show Columns
                        </h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                          {columns
                            .filter(
                              (col) =>
                                !col.name.endsWith("asset_tag") &&
                                !col.name.endsWith("_at") &&
                                !col.name.endsWith("_by") &&
                                !col.name.endsWith("status")
                            )
                            .map((col) => (
                              <label
                                key={col.name}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleColumnNames.includes(
                                    col.name
                                  )}
                                  onChange={() => {
                                    setVisibleColumnNames((prev) =>
                                      prev.includes(col.name)
                                        ? prev.filter((c) => c !== col.name)
                                        : [...prev, col.name]
                                    );
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-gray-700">
                                  {formatColumnName(col.name)}
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {paginatedTable.length > 0 ? (
              paginatedTable.map((row, i) => (
                <tr
                  key={row.asset_tag || i}
                  onClick={() => {
                    setSelectedRow(row);
                    setIsViewModalOpen(true);
                  }}
                  className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 cursor-pointer ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/100"
                  }`}
                >
                  {visibleColumns
                    .filter((c) => c.name !== "status")
                    .map((col) => (
                      <td key={col.name} className="px-4 py-3 text-center">
                        {row[col.name]}
                      </td>
                    ))}

                  <td className="text-center align-middle">
                    <div className="flex items-center justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorStatus(
                          row.status
                        )}`}
                      >
                        {formatStatus(row.status)}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-4 text-center align-middle">
                    <button
                      className="p-2 text-purple-500 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditRow(row);
                        setOriginalAssetTag(row.asset_tag);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteRow(row);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6">
                  {filteredData.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-gray-400 mb-4">
                        {IconComponent && (
                          <IconComponent size={64} className="mx-auto mb-4" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No {displayName} Found
                      </h3>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
          <div className="text-sm text-gray-600">
            Showing <span>{filteredData.length}</span> of{" "}
            <span className="font-semibold">{items.length}</span> {displayName}{" "}
            records
          </div>
          <div className="flex items-center space-x-2 mt-4 lg:mt-0">
            <button className="px-2 py-1 rounded-lg text-sm bg-gray-200 text-gray-400 cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>

            <span className="text-gray=600 text-sm">
              Page {currentPage} of{" "}
              {Math.ceil(filteredData.length / rowsPerPage)}
            </span>

            <button className="px-2 py-1 rounded-lg text-sm bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <NewTableInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        columns={columns}
        onSubmit={async (data) => {
          try {
            const res = await fetch(
              `http://localhost:5000/api/inventory/insert/${tableName}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(data),
              }
            );

            let errorMessage = "Failed to add record";
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              errorMessage = errorData.error || errorMessage;

              if (
                errorMessage.includes("duplicate key") ||
                errorMessage.includes("unique constraint") ||
                errorMessage.includes("already exists") ||
                errorMessage.includes("pkey") ||
                errorMessage.includes("23505") ||
                errorMessage.includes("Asset tag already exists")
              ) {
                toast.error(
                  "Asset tag already exists. Please use a unique asset tag."
                );
              } else {
                toast.error(errorMessage);
              }
              return;
            }

            await loadTable();
            triggerAppReload?.();
            toast.success("Record added successfully");
          } catch (err) {
            console.error(err);
            toast.error("Failed to add record");
          }
        }}
      />

      <EditRecordModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        row={editRow}
        columns={columns}
        onSave={async (updatedData) => {
          try {
            const res = await fetch(
              `http://localhost:5000/api/inventory/update/${tableName}/${originalAssetTag}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updatedData),
                displayName: currentTableDisplayName,
              }
            );

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              const errorMessage = errorData.error || "Failed to update record";

              if (
                errorMessage.includes("duplicate key") ||
                errorMessage.includes("unique constraint") ||
                errorMessage.includes("already exists") ||
                errorMessage.includes("pkey") ||
                errorMessage.includes("23505") ||
                errorMessage.includes("Asset tag already exists")
              ) {
                toast.error(
                  "Asset tag already exists. Please use a unique asset tag."
                );
              } else {
                toast.error(errorMessage);
              }
              return;
            }

            await loadTable();
            triggerAppReload?.();
            toast.success("Record updated successfully");
          } catch (err) {
            toast.error("Failed to update record");
          }
        }}
      />

      <DeleteRecordModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        row={deleteRow}
        tableName={tableName}
        onDelete={async (row) => {
          await fetch(
            `http://localhost:5000/api/inventory/delete/${tableName}/${row.asset_tag}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({ displayName: currentTableDisplayName }),
            }
          );
          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.error || "Failed to delete record");
          }
          toast.success(result.message || "Record deleted successfully");
          loadTable();
          triggerAppReload?.();
        }}
      />

      <ViewRecordModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        row={selectedRow}
        columns={columns}
      />
    </div>
  );
}

export default DynamicTablePage;
