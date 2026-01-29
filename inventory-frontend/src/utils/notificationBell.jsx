// components/header/NotificationBell.jsx
import "../main.css";
import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { Bell, Plus, Pin, Trash2, Edit3, UserPlus, UserX, UserPen } from "lucide-react";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [hasOpened, setHasOpened] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const iconMap = {
    Plus: Plus,
    Trash2: Trash2,
    Pin: Pin,
    Edit3: Edit3,
    UserPlus: UserPlus,
    Bell: Bell,
    UserX: UserX,
    UserPen: UserPen
  };
  const typeColorMap = {
    create: "text-purple-500",
    success: "text-green-500",
    delete: "text-red-600",
    update: "text-indigo-500",
  };

  useEffect(() => {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      let parsed = JSON.parse(saved);
      parsed.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n) => !n.read).length);
    }
  }, []);

  const getSeenIds = () => {
    const saved = localStorage.getItem("seenNotificationIds");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setNotifications(data);

          const lastOpened = localStorage.getItem("notificationsLastOpened");
          if (lastOpened) {
            const lastTime = new Date(lastOpened).getTime();
            const unread = data.filter(
              (n) => new Date(n.created_at).getTime() > lastTime
            );
            setUnreadCount(unread.length);
          } else {
            setUnreadCount(data.length);
          }
          Bell;
        }
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    setOpen(!open);
    if (!open) {
      const seenIds = getSeenIds();
      notifications.forEach((n) => seenIds.add(n.id));
      localStorage.setItem("notificationsLastOpened", new Date().toISOString());
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative custom-scrollbar" ref={bellRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Notifications
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-slate-500 dark:text-slate-400">
                No notifications yet
              </p>
            ) : (
              [...notifications].reverse().map((notif) => {
                const lastOpened = localStorage.getItem(
                  "notificationsLastOpened"
                );
                const isNew = lastOpened
                  ? new Date(notif.created_at).getTime() >
                    new Date(lastOpened).getTime()
                  : true;

                return (
                  <div
                    key={notif.id || `${notif.message}-${notif.created_at}`}
                    className={`p-4 flex items-start space-x-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 ${
                      isNew ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        notif.bgColor || "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {iconMap[notif.icon_name] ? (
                        React.createElement(iconMap[notif.icon_name], {
                          className: `w-5 h-5 ${
                            typeColorMap[notif.type] || "text-slate-600"
                          }`,
                        })
                      ) : (
                        <Bell className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
