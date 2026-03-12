const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const BACKEND_SRC = path.join(ROOT, "backend", "src");
const IGNORE_DIRS = new Set(["node_modules", "dist", "build", ".git"]);

const walk = (dir, list) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (IGNORE_DIRS.has(entry.name)) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, list);
      return;
    }
    if (fullPath.endsWith(".js")) list.push(fullPath);
  });
};

const fixFile = (filePath) => {
  let code = fs.readFileSync(filePath, "utf8");
  const badHelper = /const\s+(\w+)_default\s*=\s*\1_default\s*\|\|\s*\1;/g;
  code = code.replace(badHelper, "const $1_default = $1.default || $1;");
  fs.writeFileSync(filePath, code, "utf8");
};

const main = () => {
  const files = [];
  walk(BACKEND_SRC, files);
  files.forEach(fixFile);
  console.log(`Fixed helper lines in ${files.length} files.`);
};

main();
