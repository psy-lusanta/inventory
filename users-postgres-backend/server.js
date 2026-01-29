require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken } = require("./middleware/generateToken.js");
const { query, pool } = require("./config/db.js"); // PostgreSQL pool
const {
  authenticateToken,
  requireAdmin,
} = require("./middleware/middleware-auth.js");
const inventoryRoutes = require("./routes/inventoryRoutes.js");
const ensureSchema = require("./utils/ensureSchema.js");
const generateLucideIconList = require("./utils/icons/getLucideIcons.js");
const { addNotification } = require("./utils/addNotification.js");

// ==========================
//       EXPRESS APP
// ==========================
const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// ==========================
//   AUTO-CREATE SCHEMA
// ==========================
ensureSchema();

// ==========================
//   GENERATE ICONS
// ==========================
generateLucideIconList();

// ==========================
//      AUTH LOGIN
// ==========================
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const result = await query(
      "SELECT id, username, password, role, employee_name FROM users WHERE username = $1 LIMIT 1",
      [username],
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: "Invalid username or password" });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ error: "Invalid username or password" });

    // Generate ENCRYPTED token
    const encryptedToken = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      employee_name: user.employee_name,
    });

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      employee_name: user.employee_name,
      avatar_url: user.avatar_url || "https://i.pravatar.cc/300",
      token: encryptedToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// ==========================
//  CREATE USER (ADMIN ONLY)
// ==========================
app.post("/users/add", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role, employee_name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, role, employee_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, employee_name`,
      [username, hashed, role, employee_name],
    );

    addNotification(
      `${req.user.employee_name} was added by ${req.user.employee_name}`,
      "create",
      "UserPlus",
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    console.error("Create user error:", err);
    return res.status(500).json({ error: "Error creating user" });
  }
});

// ==========================
//     UPDATE USERNAME
// ==========================
app.put("/users/update-username", authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username || username.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters" });
    }

    const trimmed = username.trim();

    // Check if username already exists (except current user)
    const exists = await query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [trimmed, userId],
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    await query("UPDATE users SET username = $1 WHERE id = $2", [
      trimmed,
      userId,
    ]);

    addNotification(
      `${req.user.employee_name} was added by ${req.user.employee_name}`,
      "update",
      "UserPen",
    );

    return res.json({ message: "Username updated successfully" });
  } catch (err) {
    console.error("Update username error:", err);
    return res.status(500).json({ error: "Failed to update username" });
  }
});

// ==========================
//     CHANGE PASSWORD
// ==========================
app.put("/users/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Get current user
    const result = await query("SELECT password FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash and update new password
    const hashed = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = $1 WHERE id = $2", [
      hashed,
      userId,
    ]);

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

// ==========================
//     UPLOAD AVATAR
// ==========================
app.put("/users/me/update-avatar", authenticateToken, async (req, res) => {
  try {
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res
        .status(400)
        .json({ error: "avatar_url is missing in request body" });
    }

    if (typeof avatar_url !== "string") {
      return res.status(400).json({ error: "avatar_url must be a string" });
    }

    if (!avatar_url.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    if (avatar_url.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large" });
    }

    const userId = req.user.id;

    await query("UPDATE users SET avatar_url = $1 WHERE id = $2", [
      avatar_url,
      userId,
    ]);

    // Refresh token
    const result = await query(
      "SELECT id, username, role, employee_name, avatar_url FROM users WHERE id = $1",
      [userId],
    );

    const user = result.rows[0];

    const newToken = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      employee_name: user.employee_name,
    });

    return res.json({ token: newToken });
  } catch (err) {
    console.error("Update avatar error:", err);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
});

// ==========================
//     REFRESH TOKEN (after username change)
// ==========================
app.post("/auth/refresh-token", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      "SELECT id, username, role, employee_name FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const newToken = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      employee_name: user.employee_name,
    });

    return res.json({ token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
});

// ==========================
//     EDIT USER (ADMIN ONLY)
// ==========================
app.put("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_name, username, role } = req.body;

    if (!employee_name || !username || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const trimmedUsername = username.trim();

    // Check if username already exists (except current user)
    const exists = await query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [trimmedUsername, id],
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Update user
    await query(
      `UPDATE users 
       SET employee_name = $1, username = $2, role = $3 
       WHERE id = $4`,
      [employee_name.trim(), trimmedUsername, role, id],
    );

    // Get updated user
    const result = await query(
      "SELECT id, username, role, employee_name FROM users WHERE id = $1",
      [id],
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Edit user error:", err);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// ==========================
//     DELETE USER (ADMIN ONLY)
// ==========================
app.delete("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Optional: Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ error: "Cannot delete your own account" });
    }

    // Check if user exists
    const exists = await query("SELECT id FROM users WHERE id = $1", [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the user
    await query("DELETE FROM users WHERE id = $1", [id]);

    addNotification(
      `User: ${req.user.username} deleted by ${req.user.employee_name}`,
      "delete",
      "UserX",
    );

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ==========================
//     GET ALL USERS
// ==========================
app.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, employee_name FROM users ORDER BY id ASC",
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ error: "Cannot fetch users" });
  }
});

// ==========================
//     NOTIFICATIONS
// ==========================
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT message, type, created_at, icon_name FROM activity.notifications ORDER BY created_at DESC LIMIT 10`,
    );
    res.json(result.rows.reverse());
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed fetch notifications" });
  }
});

// ==========================
//     TABLES ROUTES
// ==========================
app.use("/api/inventory", authenticateToken, inventoryRoutes);

// ==========================
//     ICONS ROUTES
// ==========================
app.use("/api/icons", authenticateToken, require("./routes/icons/lucide.js"));

// ==========================
//       SERVER START
// ==========================
const PORT = process.env.PORT || 5000;

const path = require("path");

// Then start your server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
