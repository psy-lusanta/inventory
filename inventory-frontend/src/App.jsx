import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import Login from "./Login Form/Login";
import ProtectedRoute from "./ProtectedRoute";
import "./main.css";
import Sidebar from "./Dashboard/Sidebar";
import Header from "./Dashboard/Header";
import Dashboard from "./Dashboard/Dashboard";
import AllUsers from "./Users/allusers.jsx";
import DynamicTablePage from "./utils/dynamicTablePage.jsx";
import Reports from "./Reports/reports.jsx";
import Settings from "./Settings/Settings.jsx";

function ProtectedLayout() {
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [reload, setReload] = useState(false);
  const [dashboardReload, setDashboardReload] = useState(0);

  const triggerAppReload = () => {
    triggerSidebarReload();
    triggerReload();
  };

  const triggerReload = () => {
    setDashboardReload((prev) => prev + 1);
  };

  const triggerSidebarReload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  const handleTableCreated = async (tableData) => {
    if (!tableData?.tableName) {
      toast.error("Table name is required");
      return;
    }

    const originalTableName = tableData.tableName.trim();
    const safeTableName = tableData.tableName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const toTitleCase = (str = "") =>
      str
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    const displayName = toTitleCase(originalTableName);

    try {
      const checkRes = await fetch(
        `http://localhost:5000/api/inventory/tables`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (checkRes.ok) {
        const { tables } = await checkRes.json();
        if (tables.some((t) => t.table_name === safeTableName)) {
          toast.error(
            `Table name "${displayName}" is already in use. Please choose a different name.`
          );
          return;
        } 
      }

      const createRes = await fetch(
        `http://localhost:5000/api/inventory/create-table/${safeTableName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            displayName: toTitleCase(tableData.tableName),
            columns: tableData.columns,
            icon: tableData.icon,
          }),
        }
      );

      if (!createRes.ok) {
        const error = await createRes.json().catch(() => ({}));
        toast.error(error.error || "Failed to create table");
        return;
      }

      triggerSidebarReload();
      toast.success(`Table "${displayName}" created successfully`);
    } catch (err) {
      console.error("Error checking table existence:", err);
      toast.error("Failed to create table");
    }
  };

  return (
    <div className="custom-scrollbar h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Sidebar
        collapsed={sideBarCollapsed}
        onToggle={() => setSideBarCollapsed(!sideBarCollapsed)}
        reload={reloadTrigger}
        onPinUpdate={triggerSidebarReload}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          sideBarCollapsed={sideBarCollapsed}
          onToggleSidebar={() => setSideBarCollapsed(!sideBarCollapsed)}
          onNewTableCreated={handleTableCreated}
          onPinUpdate={triggerSidebarReload}
        />

        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6 space-y-6">
            <Outlet context={{ handleTableCreated, triggerAppReload }} />
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px",
            zIndex: 9999,
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
          success: {
            style: {
              background: "#10b981",
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/inventory/table/:tableName"
              element={<DynamicTablePage />}
            />

            <Route
              path="/all-users"
              element={<ProtectedRoute allowedRoles={["administrator"]} />}
            >
              <Route index element={<AllUsers />} />
            </Route>
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
