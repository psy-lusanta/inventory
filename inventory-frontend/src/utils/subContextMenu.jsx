import ContextMenu from "../utils/contextMenu.jsx";

function SubContextMenu({
  visible,
  x,
  y,
  onAction,
  onClose,
}) {
  const subActions = [
    { action: "pin-to-dashboard", label: "Pin to Dashboard" },
    { action: "toggle-category-chart", label: "Show in Category Chart" },
    { action: "edit", label: "Edit Submenu" },
    { action: "delete", label: "Delete Submenu" },
  ];

  return (
    <ContextMenu
      visible={visible}
      x={x}
      y={y}
      onAction={onAction}
      onClose={onClose}
      actions={subActions}
    />
  );
}

export default SubContextMenu;