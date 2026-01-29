const icons = require("lucide");
const fs = require("fs");
const path = require("path");

function generateLucideIconList() {
  const iconList = Object.keys(icons)
    .filter(key => /^[A-Z]/.test(key))
    .sort();

  const filePath = path.join(__dirname, "..", "../../lucide-icons.json");

  fs.writeFileSync(filePath, JSON.stringify(iconList, null, 2));

  console.log(`Lucide icons list updated → ${iconList.length} icons`);
  return iconList;
}

module.exports = generateLucideIconList;
