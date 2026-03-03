import { createPortal } from "react-dom";

export default function ContextMenu({
  visible,
  x,
  y,
  onAction,
  onClose,
  tableName = "",
  isPinned = false,
  isInChart = false,
  hasSubmenus = false, 
}) {
  if (!visible) return null;

  // Get current role from localStorage (same as your other components)
  const role = JSON.parse(localStorage.getItem("user"))?.role || "viewer";

  const actions = [];

  if (!hasSubmenus) {
    actions.push({
      action: "pin-to-dashboard",
      label: isPinned ? "Unpin from Dashboard" : "Pin to Dashboard",
    });
  }

  if (!hasSubmenus) {
    actions.push({
      action: "toggle-category-chart",
      label: isInChart ? "Remove from Category Chart" : "Show in Category Chart",
    });
  }

  // Only add these actions if user is NOT a viewer
  if (role !== "viewer") {
    actions.push({ action: "add-submenu", label: "Add Submenu" });
    actions.push({ action: "edit", label: "Edit Table" });
    actions.push({ action: "delete", label: "Delete Table" });
  }

  const handleClick = (action) => {
    onAction(action);
    onClose();
  };

  return createPortal(
    <div
      style={{ position: "fixed", top: y, left: x, zIndex: 999999 }}
      className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-2xl overflow-hidden py-1 min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.length > 0 ? (
        actions.map(({ action, label }) => (
          <button
            key={action}
            onClick={() => handleClick(action)}
            className={`w-full px-6 py-2.5 text-left text-sm transition-colors block ${
              action === "delete"
                ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            {label}
          </button>
        ))
      ) : (
        <div className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
          No actions available
        </div>
      )}
    </div>,
    document.body
  );
}