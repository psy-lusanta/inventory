// routes/inventory/updateSubmenuLabel.js
const express = require("express");
const router = express.Router();
const { query } = require("../../config/db.js");
const { addNotification } = require("../../utils/addNotification.js");

// POST /api/inventory/update-submenu-label
router.post("/", async (req, res) => {
  const { parent_table_name, submenu_path, new_submenu_path, new_label } =
    req.body;

  try {
    if (!parent_table_name || !submenu_path || !new_label) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await query(
      `UPDATE inventory_meta.menu_hierarchy
       SET submenu_label = $1, submenu_path = $2
       WHERE parent_table_name = $3 AND submenu_path = $4
       RETURNING *`,
      [new_label.trim(), new_submenu_path, parent_table_name, submenu_path]
    );

    if (result.rowCount === 0) {
      console.log("No rows updated - check conditions:", {
        parent_table_name,
        submenu_path, 
        new_submenu_path,
        new_label,
      });
      return res.status(404).json({ error: "Submenu not found" });
    }

    addNotification(
      `Updated submenu label to "${new_label}" by ${req.user.employee_name}`,
      "update",
      "Edit3"
    );

    res.json({ message: "Submenu updated successfully" });
  } catch (err) {
    console.error("Update submenu label error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
