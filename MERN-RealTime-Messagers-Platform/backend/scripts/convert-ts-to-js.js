const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..", "..");
const BACKEND_SRC = path.join(ROOT, "backend", "src");
const CLIENT_SRC = path.join(ROOT, "client", "src");
const EXTRA_FILES = [
  path.join(ROOT, "client", "vite.config.ts"),
];

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
    if (fullPath.endsWith(".d.ts")) return;
    if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      list.push(fullPath);
    }
  });
};

const toOutputPath = (inputPath) => {
  if (inputPath.endsWith(".tsx")) {
    return inputPath.replace(/\.tsx$/, ".jsx");
  }
  return inputPath.replace(/\.ts$/, ".js");
};

const transpileFile = (inputPath) => {
  const code = fs.readFileSync(inputPath, "utf8");
  const isClient = inputPath.startsWith(CLIENT_SRC) || inputPath.includes(path.join("client", "vite.config.ts"));
  const isTsx = inputPath.endsWith(".tsx");

  const compilerOptions = isClient
    ? {
        target: ts.ScriptTarget.ES2021,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      }
    : {
        target: ts.ScriptTarget.ES2021,
        module: ts.ModuleKind.CommonJS,
      };

  const output = ts.transpileModule(code, { compilerOptions }).outputText;
  const outputPath = toOutputPath(inputPath);

  fs.writeFileSync(outputPath, output, "utf8");
  fs.unlinkSync(inputPath);
};

const main = () => {
  const files = [];
  walk(BACKEND_SRC, files);
  walk(CLIENT_SRC, files);
  EXTRA_FILES.forEach((file) => {
    if (fs.existsSync(file)) files.push(file);
  });

  files.forEach(transpileFile);
  console.log(`Converted ${files.length} files from TS/TSX to JS/JSX.`);
};

main();
