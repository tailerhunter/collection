/* Engine: the automatic Collection check. GitHub runs this on every pull
   request and every change to main (see .github/workflows/check.yml). It runs
   the same checks as the website, and also makes sure every picture exists.
   You don't need to edit this file. */

const fs = require("fs");
const path = require("path");
const Database = require("./database.js");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const files = Database.FILES
  .filter((name) => fs.existsSync(path.join(dataDir, name)))
  .map((name) => ({ name, text: fs.readFileSync(path.join(dataDir, name), "utf8") }));
const db = Database.build(files);
const problems = db.problems.slice();

// Pictures: the web cares about capital letters, so check the exact spelling.
function realPath(src) {
  let dir = root;
  const real = [];
  for (const part of src.replace(/^\.?\//, "").split("/")) {
    const here = fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? fs.readdirSync(dir) : [];
    if (here.includes(part)) { real.push(part); dir = path.join(dir, part); continue; }
    const nearly = here.find((h) => h.toLowerCase() === part.toLowerCase());
    return { ok: false, near: nearly ? real.concat(nearly).join("/") : null };
  }
  return { ok: true };
}
for (const im of db.images) {
  if (/^https?:\/\//i.test(im.src)) continue;
  const found = realPath(im.src);
  if (found.ok) continue;
  let near = found.near;
  if (!near && !im.src.startsWith("images/") && realPath("images/" + im.src).ok) near = "images/" + im.src;
  problems.push({ level: "error", file: im.file, line: im.line,
    message: `The picture ${im.src} can't be found.`,
    fix: near ? `Did you mean ${near}? On the web, capital letters matter.`
      : "Check the spelling. Pictures go in the images folder (Add file → Upload files), and the value should start with images/" });
}

// Data files with other names are never loaded.
for (const f of fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : []) {
  if (!Database.FILES.includes(f) && /\.(csv|txt)$/i.test(f)) {
    problems.push({ level: "warning", file: f, line: 0,
      message: `data/${f} isn't part of the website, because it only reads settings.txt, collection.csv and reviews.csv.`,
      fix: "Move its rows into collection.csv (or reviews.csv), then delete it." });
  }
}

const fileRank = (f) => (Database.FILES.includes(f) ? Database.FILES.indexOf(f) : 9);
const rank = (p) => (p.level === "error" ? 0 : 1e7) + fileRank(p.file) * 1e5 + p.line;
problems.sort((a, b) => rank(a) - rank(b));
const errors = problems.filter((p) => p.level === "error");
const warnings = problems.filter((p) => p.level === "warning");
const enc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

for (const p of problems) {
  const where = `data/${p.file}` + (p.line ? `, line ${p.line}` : "");
  console.log(`${p.level === "error" ? "PROBLEM" : "Heads up"}  ${where}\n  ${p.message}\n  ${p.fix}\n`);
  // These lines make GitHub show the message right next to the line it's about.
  console.log(`::${p.level} file=data/${p.file}${p.line ? ",line=" + p.line : ""},title=${enc(p.message).replace(/[,:]/g, " ")}::${enc(p.message + " " + p.fix)}`);
}

const stats = `${db.rows.length} rows, ${db.fields.length} fields, ${db.reviews.length} reviews`;
const summary = errors.length
  ? `## ✗ The collection has ${errors.length} problem${errors.length === 1 ? "" : "s"} to fix`
  : `## ✓ The collection checks out`;
const lines = [summary, "", stats + ".", ""];
if (problems.length) {
  lines.push("| | Where | Problem | How to fix it |", "| --- | --- | --- | --- |");
  for (const p of problems) {
    const cell = (s) => String(s).replace(/\|/g, "\\|");
    lines.push(`| ${p.level === "error" ? "🔴" : "🟡"} | data/${p.file}${p.line ? " line " + p.line : ""} | ${cell(p.message)} | ${cell(p.fix)} |`);
  }
}
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
console.log(summary.replace(/^## /, "") + ` (${stats}, ${warnings.length} heads-up)`);
process.exit(errors.length ? 1 : 0);
