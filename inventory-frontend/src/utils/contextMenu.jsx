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

  // Always show these
  actions.push({ action: "add-submenu", label: "Add Submenu" });
  actions.push({ action: "edit", label: "Edit Table" });
  actions.push({ action: "delete", label: "Delete Table" });

  const handleClick = (action) => {
    onAction(action);
    onClose();
  };

  return createPortal(
    <div
      style={{ position: "fixed", top: y, left: x, zIndex: 999999 }}
      className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-2xl overflow-hidden py-1"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map(({ action, label }) => (
        <button
          key={action}
          onClick={() => handleClick(action)}
          className="w-full px-6 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors block"
        >
          {label}
        </button>
      ))}
    </div>,
    document.body
  );
}