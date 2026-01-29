import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { useUser } from "../Users/userContext.jsx";
import ContextMenu from "../utils/contextMenu.jsx";
import EditTableModal from "../Modals/editTableModal.jsx";
import AddSubmenuModal from "../Modals/addSubMenuModal.jsx";
import DeleteSubmenuModal from "../Modals/deleteSubMenuModal.jsx";
import SubContextMenu from "../utils/subContextMenu.jsx";
import {
  NotebookText,
  LayoutDashboard,
  FileText,
  Users,
  ChevronDown,
  Settings,
} from "lucide-react";

function Sidebar({ collapsed, reload, onToggle, onPinUpdate }) {
  const { tableName } = useParams();
  const { user } = useUser();
  const [schemas, setSchemas] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set([]));
  const [editData, setEditData] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    itemId: null,
  });
  const [submenuModalOpen, setSubmenuModalOpen] = useState(false);
  const [addSubmenuParent, setAddSubmenuParent] = useState(null);
  const [submenuMap, setSubmenuMap] = useState({});

  const [parentDisplayName, setParentDisplayName] = useState("");
  const [subContextMenu, setSubContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    subItem: null, // { parentId, subId }
  });

  const [editingSubTable, setEditingSubTable] = useState(null);
  const [isDeletingTable, setIsDeletingTable] = useState(false);
  const [deleteSubmenuModal, setDeleteSubmenuModal] = useState({
    isOpen: false,
    submenuName: "",
    parentName: "",
    onConfirm: () => {},
  });

  const [displayName] = useState(tableName);

  const currentTableDisplayName = displayName;

  const [dataLoaded, setDataLoaded] = useState(false);

  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [tablesRes, hierarchyRes] = await Promise.all([
        fetch(`${API_URL}/api/inventory/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/inventory/menu-hierarchy`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!tablesRes.ok || !hierarchyRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const tablesData = await tablesRes.json();
      const hierarchyData = await hierarchyRes.json();

      setSchemas(tablesData.tables || []);
      setSubmenuMap(hierarchyData.submenus || {});
      setDataLoaded(true);
    } catch (err) {
      console.error("Failed to load sidebar data:", err);
      setSchemas([]);
      setSubmenuMap({});
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [reload]);

  const menuItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      id: "reports",
      icon: FileText,
      label: "Reports",
      path: "/reports",
      roles: ["administrator"],
    },
    {
      id: "users",
      icon: Users,
      label: "Users",
      roles: ["administrator"],
      submenu: [
        {
          id: "all-users",
          label: "All Users",
          path: "/all-users",
          roles: ["administrator"],
        },
      ],
    },
    { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
  ];

  const capitalizeFirst = (str = "") =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) newExpanded.delete(itemId);
    else newExpanded.add(itemId);
    setExpandedItems(newExpanded);
  };

  const handleContextMenu = (e, itemId, isSubmenu = false) => {
    if (collapsed) return;
    e.preventDefault();

    const tableName = itemId.replace(/^table-/, "");

    // Check current pin/chart status
    const currentPinned = JSON.parse(
      localStorage.getItem("pinnedTables") || "[]"
    );
    const currentChart = JSON.parse(
      localStorage.getItem("chartTables") || "[]"
    );

    const isPinned = currentPinned.some((p) => p.table_name === tableName);
    const isInChart = currentChart.some((c) => c.table_name === tableName);

    const hasSubmenus = !!submenuMap[itemId] && submenuMap[itemId].length > 0;

    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      itemId,
      tableName,
      isPinned,
      isInChart,
      hasSubmenus,
    });
  };

  const handleContextAction = async (action) => {
    if (!contextMenu.itemId) return;
    const tableName = contextMenu.itemId.replace(/^table-/, "");

    if (action === "pin-to-dashboard") {
      const tableInfo = schemas.find((t) => t.table_name === tableName);
      if (!tableInfo) return;

      const pinned = JSON.parse(localStorage.getItem("pinnedTables") || "[]");

      if (pinned.some((p) => p.table_name === tableName)) {
        toast.info("This table is already pinned!");
        return;
      }

      if (pinned.length >= 4) {
        toast.error("You can only pin up to 4 tables. Unpin one first.");
        return;
      }

      pinned.push({
        table_name: tableInfo.table_name,
        display_name:
          tableInfo.display_name || capitalizeFirst(tableInfo.table_name),
        icon: tableInfo.icon || "NotebookText",
      });

      localStorage.setItem("pinnedTables", JSON.stringify(pinned));

      toast.success(`${tableInfo.display_name} pinned to dashboard!`);

      if (onPinUpdate) onPinUpdate();
    }

    if (action === "toggle-category-chart") {
      const tableInfo = schemas.find((t) => t.table_name === tableName);
      if (!tableInfo) return;

      const chartTables = JSON.parse(
        localStorage.getItem("chartTables") || "[]"
      );

      const exists = chartTables.some((t) => t.table_name === tableName);

      let updated;
      let message;

      if (exists) {
        updated = chartTables.filter((t) => t.table_name !== tableName);
        message = `${
          tableInfo.display_name || tableName
        } removed from category chart`;
      } else {
        if (chartTables.length >= 10) {
          toast.error("Maximum 10 tables in category chart");
          return;
        }
        updated = [
          ...chartTables,
          {
            table_name: tableInfo.table_name,
            display_name: tableInfo.display_name || capitalizeFirst(tableName),
          },
        ];
        message = `${
          tableInfo.display_name || tableName
        } added to category chart`;
      }

      localStorage.setItem("chartTables", JSON.stringify(updated));

      toast.success(message);

      if (onPinUpdate) onPinUpdate();
    }

    if (action === "add-submenu") {
      const tableInfo = schemas.find((t) => t.table_name === tableName);
      setParentDisplayName(
        tableInfo?.display_name || capitalizeFirst(tableName)
      );
      setAddSubmenuParent(contextMenu.itemId);
      setSubmenuModalOpen(true);
    }

    if (action === "edit") {
      try {
        const res = await fetch(
          `${API_URL}/api/inventory/tables/${tableName}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to load table data");

        const fullTableData = await res.json();
        const tableInfo = schemas.find((t) => t.table_name === tableName);
        const hasSubmenus = submenuMap[`table-${tableName}`]?.length > 0;

        setEditData({
          table_name: tableName,
          display_name:
            fullTableData.displayName ||
            tableName
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          icon: fullTableData.icon || "NotebookText",
          columns: fullTableData.columns || [],
          tableInfo,
          hasSubmenus,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load table for editing");
      }
    }

    if (action === "delete") {
      deleteTable(tableName);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleSaveSubTable = async (
    { tableName, displayName, columns },
    isEdit = false
  ) => {
    if (!tableName?.trim()) {
      toast.error("Table name is required");
      return;
    }
    if (!displayName?.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (columns.filter((col) => col.name?.trim()).length === 0) {
      toast.error("At least one column with a name is required");
      return;
    }

    const parentId = addSubmenuParent;
    if (!parentId) {
      toast.error("No parent table selected");
      return;
    }

    const parentTableName = parentId.replace(/^table-/, "");

    try {
      const checkRes = await fetch(
        `${API_URL}/api/inventory/tables/${parentTableName}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!checkRes.ok) {
        toast.error("Failed to check parent table");
        return;
      }
      const data = await checkRes.json();
      if (data.rows?.length > 0) {
        toast.error(
          "Cannot add submenu: Parent table must be empty (no items yet)."
        );
        return;
      }
    } catch (err) {
      toast.error("Failed to verify parent table");
      return;
    }

    try {
      const sanitizedTableName = tableName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      // Use /create-table/:tableName
      const createRes = await fetch(
        `${API_URL}/api/inventory/create-table/${sanitizedTableName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            columns: columns.filter((col) => col.name.trim()),
            displayName: displayName.trim(),
            icon: "NotebookText",
          }),
        }
      );

      if (!createRes.ok) {
        const text = await createRes.text();
        throw new Error(`Failed to create table: ${text.substring(0, 200)}`);
      }

      // Then add to menu hierarchy
      const menuRes = await fetch(`${API_URL}/api/inventory/menu-hierarchy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          parent_table_name: parentTableName,
          label: displayName.trim().replace(/\b\w/g, (l) => l.toUpperCase()),
          count: 1,
          submenu_path: `/inventory/table/${sanitizedTableName}`,
        }),
      });

      if (!menuRes.ok) {
        console.warn("Table created but menu hierarchy failed");
      }

      toast.success(`Sub-table "${displayName}" created!`);
      fetchAllData();
    } catch (err) {
      console.error("Sub-table creation error:", err);
      toast.error("Failed to create sub-table");
    } finally {
      setSubmenuModalOpen(false);
      setAddSubmenuParent(null);
      setParentDisplayName("");
      setEditingSubTable(null);
    }
  };

  const handleSubContextAction = async (action) => {
    if (!subContextMenu.subItem) return;

    const { tableName } = subContextMenu.subItem;

    // Find table info for display_name
    const tableInfo = schemas.find((t) => t.table_name === tableName);
    if (!tableInfo) return;

    if (action === "pin-to-dashboard") {
      const tableInfo = schemas.find((t) => t.table_name === tableName);
      if (!tableInfo) return;

      const pinned = JSON.parse(localStorage.getItem("pinnedTables") || "[]");

      if (pinned.some((p) => p.table_name === tableName)) {
        toast.info("This table is already pinned!");
        return;
      }

      if (pinned.length >= 4) {
        toast.error("You can only pin up to 4 tables. Unpin one first.");
        return;
      }

      pinned.push({
        table_name: tableInfo.table_name,
        display_name:
          tableInfo.display_name || capitalizeFirst(tableInfo.table_name),
        icon: tableInfo.icon || "NotebookText",
      });

      localStorage.setItem("pinnedTables", JSON.stringify(pinned));

      toast.success(`${tableInfo.display_name} pinned to dashboard!`);

      if (reload) reload();
    }

    if (action === "toggle-category-chart") {
      const tableInfo = schemas.find((t) => t.table_name === tableName);
      if (!tableInfo) return;

      const chartTables = JSON.parse(
        localStorage.getItem("chartTables") || "[]"
      );

      const exists = chartTables.some((t) => t.table_name === tableName);

      let updated;
      let message;

      if (exists) {
        updated = chartTables.filter((t) => t.table_name !== tableName);
        message = `${
          tableInfo.display_name || tableName
        } removed from category chart`;
      } else {
        if (chartTables.length >= 10) {
          toast.error("Maximum 10 tables in category chart");
          return;
        }
        updated = [
          ...chartTables,
          {
            table_name: tableInfo.table_name,
            display_name: tableInfo.display_name || capitalizeFirst(tableName),
          },
        ];
        message = `${
          tableInfo.display_name || tableName
        } added to category chart`;
      }

      localStorage.setItem("chartTables", JSON.stringify(updated));

      toast.success(message);

      if (reload) reload();
    }

    if (action === "edit") {
      try {
        const tableName = subContextMenu.subItem.tableName;
        const parentId = subContextMenu.subItem.parentId;

        // Find submenu entry for label
        const submenuList = submenuMap[parentId] || [];
        const submenuEntry = submenuList.find((sub) =>
          sub.path.includes(tableName)
        );

        if (!submenuEntry) {
          toast.error("Submenu data not found");
          return;
        }

        const res = await fetch(
          `${API_URL}/api/inventory/tables/${tableName}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to load table data");

        const data = await res.json();
        console.log("Submenu entry for edit:", submenuEntry);

        setEditData({
          table_name: tableName,
          display_name: submenuEntry.label,
          icon: data.icon || "NotebookText",
          columns: data.columns || [],
          isSubTable: true,
          submenuPath: submenuEntry.submenu_path || submenuEntry.path,
          parentTableName: parentId.replace(/^table-/, ""),
        });
      } catch (err) {
        toast.error("Failed to load sub-table for editing");
      }
    }

    if (action === "delete") {
      setDeleteSubmenuModal({
        isOpen: true,
        submenuName: subContextMenu.subItem.subName || "this submenu",
        parentName: subContextMenu.subItem.parentName || "parent",
        onConfirm: () =>
          deleteTable(
            subContextMenu.subItem.tableName,
            subContextMenu.subItem.parentId
          ),
      });
      return;
    }
    setSubContextMenu({ visible: false, x: 0, y: 0, subItem: null });
  };

  const deleteTable = async (tableName, parentId = null) => {
    setIsDeletingTable(true);
    try {
      const res = await fetch(
        `${API_URL}/api/inventory/delete-table/${tableName}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ displayName: currentTableDisplayName }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "Table deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete table");
      }

      setSchemas((prev) => prev.filter((t) => t.table_name !== tableName));

      setSubmenuMap((prev) => {
        const newMap = { ...prev };
        delete newMap[`table-${tableName}`];

        if (parentId && newMap[parentId]) {
          newMap[parentId] = newMap[parentId].filter(
            (sub) => !sub.path.includes(`/${tableName}`)
          );
          if (newMap[parentId].length === 0) delete newMap[parentId];
        }

        return newMap;
      });

      if (onPinUpdate) onPinUpdate();
    } catch (err) {
      toast.error("Network error — failed to delete table");
    } finally {
      setIsDeletingTable(false); 
    }
  };

  const updateTable = async ({
    oldName,
    tableName,
    displayName,
    icon,
    columns,
  }) => {
    try {
      const res = await fetch(
        `${API_URL}/api/inventory/update-table-structure/${oldName}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            displayName,
            icon,
            columns,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update table");
      }

      toast.success("Table updated successfully!");

      setSchemas((prev) =>
        prev.map((t) =>
          t.table_name === oldName
            ? { ...t, display_name: displayName, icon }
            : t
        )
      );

      fetchAllData();
    } catch (err) {
      toast.error(err.message || "Failed to update table");
    } finally {
      setEditData(null);
    }
  };

  const handleClickOutside = () => {
    if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    if (subContextMenu.visible)
      setSubContextMenu({ ...subContextMenu, visible: false });
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu, subContextMenu]);

  useEffect(() => {
    async function fetchAllData() {
      try {
        const token = localStorage.getItem("token");
        const [tablesRes, hierarchyRes] = await Promise.all([
          fetch(`${API_URL}/api/inventory/tables`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/inventory/menu-hierarchy`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!tablesRes.ok || !hierarchyRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const tablesData = await tablesRes.json();
        const hierarchyData = await hierarchyRes.json();

        setSchemas(tablesData.tables || []);
        setSubmenuMap(hierarchyData.submenus || {});
        setDataLoaded(true); // ← Both loaded now
      } catch (err) {
        console.error("Failed to load sidebar data:", err);
        setDataLoaded(true);
      }
    }
    fetchAllData();
  }, [reload]);

  return (
    <>
      <div
        className={`${
          collapsed ? "w-20" : "w-72"
        } transition-all duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col h-screen relative`}
      >
        {/* Logo */}
        <div className="flex p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <NotebookText className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                  Inventory
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Admin Panel
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {dataLoaded &&
            [
              ...menuItems.filter((i) => i.id !== "settings"),
              ...schemas
                .filter((tbl) => {
                  const targetPath = `/inventory/table/${tbl.table_name}`;
                  const isSubmenu = Object.values(submenuMap)
                    .flat()
                    .some((sub) => sub.path === targetPath);
                  return !isSubmenu;
                })
                .map((tbl) => {
                  const itemId = `table-${tbl.table_name}`;
                  const Icon =
                    tbl.icon && Icons[tbl.icon]
                      ? Icons[tbl.icon]
                      : NotebookText;
                  const hasSubmenus =
                    submenuMap[itemId] && submenuMap[itemId].length > 0;
                  return {
                    id: itemId,
                    icon: Icon,
                    label: tbl.display_name || capitalizeFirst(tbl.table_name),
                    path: `/inventory/table/${tbl.table_name}`,
                    submenu: hasSubmenus ? submenuMap[itemId] : undefined,
                  };
                }),
              menuItems.find((i) => i.id === "settings"),
            ]
              .filter(
                (item) =>
                  item && (!item.roles || item.roles.includes(user?.role))
              )
              .map((item) => {
                const isActive = location.pathname === item.path;
                const isParentActive = item.submenu?.some(
                  (sub) => location.pathname === sub.path
                );

                // Determine if this is a dynamic table item (has table- prefix) or static
                const isDynamicTable = item.id.startsWith("table-");

                return (
                  <div key={item.id}>
                    {item.submenu ? (
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        // Only add onContextMenu for dynamic tables
                        {...(isDynamicTable
                          ? {
                              onContextMenu: (e) =>
                                handleContextMenu(e, item.id),
                            }
                          : {})}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                          isParentActive
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          {!collapsed && (
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {item.label}
                            </span>
                          )}
                        </div>
                        {!collapsed && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedItems.has(item.id) ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        // Only add onContextMenu for dynamic tables
                        {...(isDynamicTable
                          ? {
                              onContextMenu: (e) =>
                                handleContextMenu(e, item.id),
                            }
                          : {})}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          {!collapsed && (
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {item.label}
                            </span>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Submenu rendering (unchanged) */}
                    {!collapsed &&
                      item.submenu &&
                      expandedItems.has(item.id) && (
                        <div className="ml-8 mt-2 space-y-1">
                          {item.submenu.map((sub) => {
                            // Check if this is the static "All Users" submenu (or any future static ones)
                            const isStaticSubmenu = sub.id === "all-users";

                            return (
                              <div
                                key={sub.id}
                                // Only apply onContextMenu to dynamic sub-tables (not static navigation)
                                {...(!isStaticSubmenu
                                  ? {
                                      onContextMenu: (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSubContextMenu({
                                          visible: true,
                                          x: e.pageX,
                                          y: e.pageY,
                                          subItem: {
                                            parentId: item.id,
                                            subId: sub.id,
                                            tableName: sub.path
                                              .split("/")
                                              .pop(),
                                            subName: sub.label,
                                            parentName: item.label,
                                          },
                                        });
                                      },
                                    }
                                  : {})}
                                className="group relative"
                              >
                                <Link
                                  to={sub.path}
                                  className={`w-full block text-left p-2 text-sm rounded-lg transition-all cursor-pointer ${
                                    location.pathname === sub.path
                                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                  }`}
                                >
                                  {sub.label}
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
        </nav>

        {/* User Profile */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <img
                src={user?.avatar_url || "https://i.pravatar.cc/300"}
                alt="User Avatar"
                className="w-10 h-10 rounded-full ring-2 ring-blue-500"
              />
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                  {user?.username || "User"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role === "administrator" ? "Administrator" : "Viewer"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        tableName={contextMenu.tableName}
        isPinned={contextMenu.isPinned}
        isInChart={contextMenu.isInChart}
        hasSubmenus={contextMenu.hasSubmenus}
        onAction={handleContextAction}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
      />

      <AddSubmenuModal
        isOpen={submenuModalOpen}
        onClose={() => {
          setSubmenuModalOpen(false);
          setAddSubmenuParent(null);
          setParentDisplayName("");
          setEditingSubTable(null);
        }}
        onCreate={(data) => handleSaveSubTable(data, !!editingSubTable)}
        parentName={parentDisplayName}
        initialData={editingSubTable}
      />

      {editData && (
        <EditTableModal
          isOpen={!!editData}
          tableData={editData}
          onClose={() => setEditData(null)}
          onSave={updateTable}
          onSuccess={() => fetchAllData()}
        />
      )}

      <DeleteSubmenuModal
        isOpen={deleteSubmenuModal.isOpen}
        onClose={() =>
          setDeleteSubmenuModal({ ...deleteSubmenuModal, isOpen: false })
        }
        submenuName={deleteSubmenuModal.submenuName}
        parentName={deleteSubmenuModal.parentName}
        onConfirm={() => {
          deleteSubmenuModal.onConfirm();
          setDeleteSubmenuModal({ ...deleteSubmenuModal, isOpen: false });
        }}
        isDeleting={isDeletingTable}
      />

      <SubContextMenu
        visible={subContextMenu.visible}
        x={subContextMenu.x}
        y={subContextMenu.y}
        onAction={handleSubContextAction}
        onClose={() => setSubContextMenu({ ...subContextMenu, visible: false })}
      />
    </>
  );
}

export default Sidebar;
