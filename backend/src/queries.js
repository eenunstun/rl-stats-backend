const fs = require("fs");
const path = require("path");

const SQL_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "database",
  "advancedqueries.sql"
);

// Parses a .sql file annotated with `-- name: <slug>` markers and returns
// a Map of slug -> SQL string. Each section runs from one marker to the
// next (or EOF), so trailing whitespace and inline comments are preserved
// and passed through to Postgres as-is.
function loadQueries() {
  const text = fs.readFileSync(SQL_PATH, "utf8");
  const re = /^--\s*name:\s*([\w-]+)\s*$/gm;
  const headers = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    headers.push({ name: m[1], markerStart: m.index, bodyStart: re.lastIndex });
  }
  const map = new Map();
  for (let i = 0; i < headers.length; i++) {
    const end = i + 1 < headers.length ? headers[i + 1].markerStart : text.length;
    const body = text.slice(headers[i].bodyStart, end).trim();
    if (!body) {
      throw new Error(`Empty SQL body for query "${headers[i].name}" in ${SQL_PATH}`);
    }
    map.set(headers[i].name, body);
  }
  return map;
}

const queries = loadQueries();

function get(name) {
  const q = queries.get(name);
  if (!q) {
    throw new Error(
      `Unknown query "${name}". Known: ${[...queries.keys()].join(", ")}`
    );
  }
  return q;
}

module.exports = { get, names: () => [...queries.keys()] };
