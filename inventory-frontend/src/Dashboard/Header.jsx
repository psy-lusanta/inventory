import React, { useState, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Filter, Menu, Plus, Search } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import { useUser } from "../Users/userContext.jsx";
import NewTableModal from "../Modals/newTableModal.jsx";
import GlobalSearch from "../utils/globalSearch.jsx";
import NotificationBell from "../utils/notificationBell.jsx";

function Header({
  sideBarCollapsed,
  onToggleSidebar,
  onNewTableCreated,
  onPinUpdate,
}) {
  const { user } = useUser();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const token = localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const { tableName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  let role = null;

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    if (!tableName) {
      // Static pages
      const titles = {
        "/dashboard": "Dashboard",
        "/reports": "Reports",
        "/all-users": "All Users",
        "/users": "Add Users",
        "/group-users": "User Groups",
        "/user-roles": "Roles & Permission",
        "/settings": "Settings",
      };
      setPageTitle(titles[location.pathname] || "Dashboard");
      return;
    }

    // Dynamic table page — fetch real display name
    const fetchDisplayName = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/inventory/tables/${tableName}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        const display =
          data.displayName ||
          tableName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        setPageTitle(display);
      } catch (err) {
        console.error(err);
        // Fallback
        setPageTitle(
          tableName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        );
      }
    };

    fetchDisplayName();
  }, [tableName, location.pathname, token]);

  const handleMenuClick = () => {
    setMenuOpen((prev) => !prev);
    onToggleSidebar?.();
  };

  const handleProfileClick = () => {
    setProfileOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("profile-dropdown");
      const profileButton = document.querySelector("[data-profile-button]"); // Add data attribute below

      if (
        dropdown &&
        !dropdown.contains(event.target) &&
        profileButton &&
        !profileButton.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blue-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          <button
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={handleMenuClick}
          >
            <Menu
              className={`w-6 h-6 transition-transform duration-300 ${
                menuOpen
                  ? "rotate-90 scale-100 text-blue-500"
                  : "rotate-0 scale-100"
              }`}
            />
          </button>

          <div className="hidden md:block">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              {pageTitle}
            </h1>
            <p className="text-1xl font-light text-slate-800 dark:text-white">
              Welcome Back, {user?.username || "User"}! here's what's happening
              today
            </p>
          </div>
        </div>

        {/*SEARCH BAR*/}
        <GlobalSearch />

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* New Table Button */}
          <button
            className="hidden lg:flex items-center space-x-2 py-2 px-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full text-white shadow-lg cursor-pointer hover:opacity-90 transform transition-all duration-200 ease-in-out active:translate-y-1 active:scale-95 active:shadow-inner focus:outline-none"
            onClick={() => setShowNewTableModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Table</span>
          </button>

          {/* Notification */}
          <NotificationBell />

          {/* User Profile */}
          <div
            className="relative flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-700"
            style={{ minWidth: "200px" }}
          >
            <img
              src={user?.avatar_url || "https://i.pravatar.cc/300"}
              alt="User Avatar"
              className="w-8 h-8 rounded-full ring-2 ring-blue-500"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {user?.username || "User"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {user?.role === "administrator" ? "Administrator" : "Viewer"}
              </p>
            </div>
            <button
              data-profile-button
              className="cursor-pointer transition"
              style={{ minWidth: "32px" }}
              onClick={handleProfileClick}
            >
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  profileOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {profileOpen && (
              <div
                id="profile-dropdown"
                className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50"
                style={{ minWidth: "160px" }}
              >
                <button
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                >
                  Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  onClick={() => {
                    setProfileOpen(false);
                    localStorage.removeItem("token");
                    window.dispatchEvent(new Event("storage", { key: "token" }));
                    navigate("/login");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Table Modal */}
      {showNewTableModal && (
        <NewTableModal
          isOpen={showNewTableModal}
          onClose={() => setShowNewTableModal(false)}
          onCreate={async (tableData) => {
            await onNewTableCreated(tableData);
          }}
        />
      )}
    </div>
  );
}

export default Header;
