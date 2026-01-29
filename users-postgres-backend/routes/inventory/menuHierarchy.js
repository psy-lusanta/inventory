// routes/inventory/menuHierarchy.js
const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const { addNotification } = require("../../utils/addNotification.js");

// GET /api/inventory/menu-hierarchy
// Returns all submenus grouped by parent table
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        parent_table_name,
        submenu_label AS label,
        submenu_path AS path,
        display_order
      FROM inventory_meta.menu_hierarchy
      ORDER BY parent_table_name, display_order ASC;
    `);

    // Group by parent_table_name
    const grouped = result.rows.reduce((acc, row) => {
      const parentId = `table-${row.parent_table_name}`;
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push({
        id: row.id,
        label: row.label,
        path: row.path || "#",
      });
      return acc;
    }, {});

    res.json({ submenus: grouped });
  } catch (err) {
    console.error("Error fetching menu hierarchy:", err);
    res.status(500).json({ error: "Failed to load menu hierarchy" });
  }
});

// Create one or more submenus under a parent table
router.post("/", async (req, res) => {
  const { parent_table_name, label, count = 1, submenu_path } = req.body;

  if (!parent_table_name || !label) {
    return res
      .status(400)
      .json({ error: "parent_table_name and label are required" });
  }

  if (count < 1 || count > 20) {
    return res.status(400).json({ error: "count must be between 1 and 20" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get next display_order
      const maxResult = await client.query(
        `SELECT MAX(display_order) AS max_order 
       FROM inventory_meta.menu_hierarchy 
       WHERE parent_table_name = $1`,
        [parent_table_name]
      );
      let nextOrder = (maxResult.rows[0]?.max_order ?? -1) + 1;

      const createdSubmenus = [];

      for (let i = 0; i < count; i++) {
        const submenuLabel = count > 1 ? `${label} ${i + 1}` : label;

        const insertResult = await client.query(
          `
        INSERT INTO inventory_meta.menu_hierarchy 
        (parent_table_name, submenu_label, submenu_path, display_order)
        VALUES ($1, $2, $3, $4)
        RETURNING id, submenu_label AS label, submenu_path AS path
      `,
          [parent_table_name, submenuLabel, submenu_path || null, nextOrder + i]
        );

        createdSubmenus.push({
          id: insertResult.rows[0].id,
          label: insertResult.rows[0].label,
          path: insertResult.rows[0].path || "#",
        });
      }

      await client.query("COMMIT");

      const parentId = `table-${parent_table_name}`;

      addNotification(
        `Created submenu under "${parent_table_name}" by ${req.user.employee_name}`,
        "create",
        "Plus"
      );

      res.json({
        submenus: { [parentId]: createdSubmenus },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error creating submenu:", err);
    res.status(500).json({ error: "Failed to create submenu" });
  }
});

module.exports = router;
