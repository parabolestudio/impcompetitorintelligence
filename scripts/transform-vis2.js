const fs = require("fs");
const path = require("path");

const vis1Path = path.join(__dirname, "..", "data", "data_vis1.csv");
const vis2Path = path.join(__dirname, "..", "data", "data_vis2.csv");
const outputFirmsPath = path.join(
  __dirname,
  "..",
  "data",
  "data_vis2_firms.csv",
);
const outputCountriesPath = path.join(
  __dirname,
  "..",
  "data",
  "data_vis2_countries.csv",
);

// Minimum total moves a "New firm" must have to be included in the output
const MIN_MOVES_PER_NEW_FIRM = 3;

// Country → Continent mapping (geographic)
const COUNTRY_TO_CONTINENT = {
  Australia: "Oceania",
  Belgium: "Europe",
  France: "Europe",
  Germany: "Europe",
  India: "Asia",
  Luxembourg: "Europe",
  Netherlands: "Europe",
  Singapore: "Asia",
  Sweden: "Europe",
  Switzerland: "Europe",
  UAE: "Asia",
  UK: "Europe",
  USA: "North America",
};

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

// ---------- Read & parse both CSVs ----------

const rawVis1 = fs.readFileSync(vis1Path, "utf-8");
const linesVis1 = rawVis1.trim().split("\n");
const headerVis1 = linesVis1[0].split(",").map((h) => h.trim());

const rawVis2 = fs.readFileSync(vis2Path, "utf-8");
const linesVis2 = rawVis2.trim().split("\n");
const headerVis2 = linesVis2[0].split(",").map((h) => h.trim());

// Column indices – vis1
const newFirmIdx1 = headerVis1.indexOf("New firm");
if (newFirmIdx1 === -1) {
  console.error('Could not find "New firm" column in data_vis1.csv.');
  process.exit(1);
}

// Column indices – vis2
const newFirmIdx2 = headerVis2.indexOf("New firm");
const countryIdx = headerVis2.indexOf("Country after move");
const cityIdx = headerVis2.indexOf("City after move");

if (newFirmIdx2 === -1 || countryIdx === -1 || cityIdx === -1) {
  console.error(
    'Could not find required columns in data_vis2.csv ("New firm", "Country after move", "City after move").',
  );
  process.exit(1);
}

// Sanity check: both files should have the same number of data rows
if (linesVis1.length !== linesVis2.length) {
  console.warn(
    `Warning: row count mismatch – vis1 has ${linesVis1.length - 1} data rows, vis2 has ${linesVis2.length - 1}.`,
  );
}

// ---------- Aggregate by New firm, and by (New firm, Country) ----------

const firms = new Map(); // key: New firm → { count }
const firmCountries = new Map(); // key: "firm|||country" → { count, cities }

const dataRows = Math.min(linesVis1.length, linesVis2.length);
for (let i = 1; i < dataRows; i++) {
  const fieldsVis1 = parseCSVRow(linesVis1[i]);
  const fieldsVis2 = parseCSVRow(linesVis2[i]);

  const newFirm = fieldsVis1[newFirmIdx1] || fieldsVis2[newFirmIdx2];
  const country = fieldsVis2[countryIdx] || "";
  const city = fieldsVis2[cityIdx] || "";

  // Firm-level totals
  if (!firms.has(newFirm)) {
    firms.set(newFirm, { count: 0 });
  }
  firms.get(newFirm).count++;

  // (Firm, Country)-level totals
  const key = `${newFirm}|||${country}`;
  if (!firmCountries.has(key)) {
    firmCountries.set(key, { count: 0, cities: new Set() });
  }
  const group = firmCountries.get(key);
  group.count++;
  if (city) group.cities.add(city);
}

// ---------- Write output CSVs ----------

// Helper: format a Set as a quoted semicolon-separated string for CSV
function formatArray(set) {
  const arr = [...set];
  if (arr.length === 0) return "";
  return `"${arr.join("; ")}"`;
}

function quoteField(val) {
  return val.includes(",") ? `"${val}"` : val;
}

// --- CSV 1: Firms with total moves ---
const firmLines = ["New firm,Total moves"];

const sortedFirms = [...firms.entries()].sort((a, b) =>
  a[0].localeCompare(b[0]),
);

let includedFirmCount = 0;
for (const [firm, group] of sortedFirms) {
  if (group.count < MIN_MOVES_PER_NEW_FIRM) continue;
  firmLines.push(`${quoteField(firm)},${group.count}`);
  includedFirmCount++;
}

fs.writeFileSync(outputFirmsPath, firmLines.join("\n"), "utf-8");
console.log(`Firms CSV written to ${outputFirmsPath}`);
console.log(
  `  → ${includedFirmCount} firms included (filtered from ${firms.size}, min ${MIN_MOVES_PER_NEW_FIRM} moves)`,
);

// --- CSV 2: Per firm per country breakdown ---
const countryLines = ["New firm,Country,Continent,Moves,Cities"];

const sortedCountries = [...firmCountries.entries()].sort((a, b) => {
  const [firmA, countryA] = a[0].split("|||");
  const [firmB, countryB] = b[0].split("|||");
  return firmA.localeCompare(firmB) || countryA.localeCompare(countryB);
});

let includedCountryCount = 0;
for (const [key, group] of sortedCountries) {
  const [firm, country] = key.split("|||");
  if ((firms.get(firm)?.count || 0) < MIN_MOVES_PER_NEW_FIRM) continue;
  const continent = COUNTRY_TO_CONTINENT[country.trim()] || "Unknown";
  countryLines.push(
    `${quoteField(firm)},${quoteField(country)},${continent},${group.count},${formatArray(group.cities)}`,
  );
  includedCountryCount++;
}

fs.writeFileSync(outputCountriesPath, countryLines.join("\n"), "utf-8");
console.log(`Countries CSV written to ${outputCountriesPath}`);
console.log(
  `  → ${includedCountryCount} (firm, country) rows included (filtered, min ${MIN_MOVES_PER_NEW_FIRM} moves per firm)`,
);
