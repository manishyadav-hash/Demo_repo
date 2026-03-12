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
  const requireRegex = /^const\s+(\w+)\s*=\s*require\(([^)]+)\);/gm;
  const matches = [...code.matchAll(requireRegex)];

  matches.forEach((match) => {
    const varName = match[1];
    const defaultRef = new RegExp(`\\b${varName}\\.default\\b`, "g");
    if (!defaultRef.test(code)) return;

    const helperName = `${varName}_default`;
    if (!new RegExp(`const\s+${helperName}\s*=`).test(code)) {
      const insert = `const ${helperName} = ${varName}.default || ${varName};`;
      code = code.replace(match[0], `${match[0]}\n${insert}`);
    }

    code = code.replace(defaultRef, helperName);
  });

  fs.writeFileSync(filePath, code, "utf8");
};

const main = () => {
  const files = [];
  walk(BACKEND_SRC, files);
  files.forEach(fixFile);
  console.log(`Patched default imports in ${files.length} files.`);
};

main();
