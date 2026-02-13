const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "data", "data_vis1.csv");
const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "data_vis1_transformed.csv",
);

const raw = fs.readFileSync(inputPath, "utf-8");
const lines = raw.trim().split("\n");

// Parse header to find column indices
const header = lines[0].split(",").map((h) => h.trim());

// CSV-aware row parser (handles quoted fields with commas)
function parseCSVRow(row) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const formerIdx = header.indexOf("Former firm");
const newIdx = header.indexOf("New firm");
const titleIdx = header.indexOf("New job title");
const teamIdx = header.indexOf("Team (IMP defined)");
const seniorityIdx = header.indexOf("Seniority (IMP defined)");

if (formerIdx === -1 || newIdx === -1) {
  console.error(
    'Could not find "Former firm" or "New firm" columns in the CSV.',
  );
  process.exit(1);
}

// Count occurrences and collect unique values for each (Former firm, New firm) pair
const groups = new Map();

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVRow(lines[i]);
  const former = fields[formerIdx];
  const newFirm = fields[newIdx];
  const title = fields[titleIdx] || "";
  const team = fields[teamIdx] || "";
  const seniority = fields[seniorityIdx] || "";
  const key = `${former}|||${newFirm}`;

  if (!groups.has(key)) {
    groups.set(key, {
      count: 0,
      titles: new Set(),
      teams: new Set(),
      seniorities: new Set(),
    });
  }
  const group = groups.get(key);
  group.count++;
  if (title) group.titles.add(title);
  if (team) group.teams.add(team);
  if (seniority) group.seniorities.add(seniority);
}

// Helper: format a Set as a quoted array string for CSV, e.g. "[A; B; C]"
function formatArray(set) {
  const arr = [...set];
  if (arr.length === 0) return "";
  return `"${arr.join("; ")}"`; // always quote because content may contain commas
}

// Build output CSV
const outputLines = [
  "Former firm,New firm,Number of Moves,New job titles,Teams (IMP defined),Seniorities (IMP defined)",
];

for (const [key, group] of groups) {
  const [former, newFirm] = key.split("|||");
  // Quote fields that contain commas
  const fmtFormer = former.includes(",") ? `"${former}"` : former;
  const fmtNew = newFirm.includes(",") ? `"${newFirm}"` : newFirm;
  const fmtTitles = formatArray(group.titles);
  const fmtTeams = formatArray(group.teams);
  const fmtSeniorities = formatArray(group.seniorities);
  outputLines.push(
    `${fmtFormer},${fmtNew},${group.count},${fmtTitles},${fmtTeams},${fmtSeniorities}`,
  );
}

fs.writeFileSync(outputPath, outputLines.join("\n"), "utf-8");
console.log(`Transformed CSV written to ${outputPath}`);
console.log(`Total unique combinations: ${groups.size}`);
