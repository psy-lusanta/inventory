const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const { addNotification } = require("../../utils/addNotification.js");

router.get("/test", (req, res) => res.json({ message: "rename route working" }));

// POST /api/inventory/update-table-meta
router.post("/", async (req, res) => {
  const { table_name, display_name, icon } = req.body;

  try {
    if (!table_name) return res.status(400).json({ error: "table_name required" });

    await query(
      `UPDATE inventory_meta.tablename_icon
       SET display_name = $1, icon = $2
       WHERE table_name = $3`,
      [display_name, icon || "NotebookText", table_name]
    );

    addNotification(
      `Updated "${display_name}" table settings by ${req.user.employee_name}`, "update", "Edit3"
    );

    res.json({ message: "Table settings updated" });
  } catch (err) {
    console.error("Update meta error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;