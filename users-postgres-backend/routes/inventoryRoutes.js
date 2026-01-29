const express = require("express");
const router = express.Router();

// Middleware
const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/middleware-auth.js");

// Sub-routes
const createTableRoute = require("./inventory/createTable");
const renameTableRoute = require("./inventory/renameTable");
const dropTableRoute = require("./inventory/dropTable");
const insertRoute = require("./inventory/insertRecord");
const updateRoute = require("./inventory/updateRecord");
const deleteRoute = require("./inventory/deleteRecord");
const getAllRoute = require("./inventory/getAllRecords");
const getOneRoute = require("./inventory/getOneRecord");
const listTablesRoute = require("./inventory/listTables");
const menuHierarchyRoute = require("./inventory/menuHierarchy");
const updateTableStructureRoute = require("./inventory/updatetableStructure");
const updateTableMetaRoute = require("./inventory/updateTableMeta");
const updateSubmenuLabelRoute = require("./inventory/updateSubmenuLabel");

// ===============
//   LIST TABLES
// ===============
router.use(authenticateToken, listTablesRoute);

// ===============
//   MENU HIERARCHY
// ===============
router.use("/menu-hierarchy", authenticateToken, menuHierarchyRoute);

// ===============
//   ADMIN ONLY
// ===============
router.use("/create-table", authenticateToken, requireAdmin, createTableRoute);
router.use("/rename-table", authenticateToken, requireAdmin, renameTableRoute);
router.use("/delete-table", authenticateToken, requireAdmin, dropTableRoute);
router.use(
  "/update-table-structure",
  authenticateToken,
  requireAdmin,
  updateTableStructureRoute
);
router.use(
  "/update-table-meta",
  authenticateToken,
  requireAdmin,
  updateTableMetaRoute
);
router.use(
  "/update-submenu-label",
  authenticateToken,
  requireAdmin,
  updateSubmenuLabelRoute
);

// ===============
//   CRUD ROUTES
// ===============
router.use("/insert", authenticateToken, insertRoute);
router.use("/update", authenticateToken, updateRoute);
router.use("/delete", authenticateToken, deleteRoute);
router.use("/all", authenticateToken, getAllRoute);
router.use("/one", authenticateToken, getOneRoute);

module.exports = router;
