const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "..", "../../lucide-icons.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Icon list not generated yet" });
  }

  const iconList = JSON.parse(fs.readFileSync(filePath, "utf8"));
  res.json(iconList);
});

module.exports = router;
