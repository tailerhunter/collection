/* Engine: reads the three data files and checks them for problems.
   You don't need to edit this file.
   The web page uses it, and so does the automatic Collection check that runs
   on GitHub whenever someone opens a pull request. It also answers the
   questions from "Ask the database" and works out the recommendations. */

const Database = (() => {
  // The files in the data folder, in the order problems are listed.
  const FILES = ["settings.txt", "collection.csv", "reviews.csv"];
  const SETTINGS = ["title", "tagline", "by", "about", "theme", "items", "card title", "card subtitle",
    "card image", "card shape", "filters", "sort", "search", "details"];
  const THEMES = ["gallery", "night", "retro", "garden"];
  const SHAPES = ["tall", "square", "wide"];
  const ID = /^[a-z0-9][a-z0-9-]*$/;
  const NUMBER = /^-?\$?\d+(?:\.\d+)?$/;
  const STARS = "__stars";

  const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const isNumber = (s) => NUMBER.test(String(s).trim());
  const toNumber = (s) => parseFloat(String(s).trim().replace("$", ""));
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const listing = (arr) => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];

  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // The closest name in a list, if it's close enough to be a typo.
  function closest(name, names) {
    let best = null, bestD = Infinity;
    for (const n of names) {
      const dd = distance(norm(name), norm(n));
      if (dd < bestD) { best = n; bestD = dd; }
    }
    return bestD <= (name.length <= 4 ? 1 : Math.max(2, Math.floor(name.length / 4))) ? best : null;
  }

  // ---------- reading a CSV file ----------

  // Returns rows of cells, each row with the line number it starts on.
  // Values in "double quotes" can contain commas (and "" means one quote).
  function parseCSV(text, file, problem) {
    text = String(text || "").replace(/\r\n?/g, "\n");
    // A quote that never closes would swallow the rest of the file. Report it,
    // then read the file again treating that quote as an ordinary character.
    const literal = new Set();
    for (let tries = 0; tries < 50; tries++) {
      const res = scan(text, literal);
      if (!res.unclosed) return res;
      literal.add(res.unclosed.index);
      problem("error", file, res.unclosed.line,
        `A "double quote" opens on line ${res.unclosed.line} and never closes.`,
        `Add the closing " at the end of that value, or delete the opening one.`);
    }
    return scan(text, literal);
  }

  function scan(text, literal) {
    const rows = [], blanks = [];
    let i = 0, line = 1;
    const n = text.length;
    while (i < n) {
      const start = line;
      const cells = [];
      let cell = "", inQuote = false, quoteAt = -1, quoteLine = 0, rowDone = false;
      while (!rowDone) {
        if (i >= n) {
          if (inQuote) return { unclosed: { index: quoteAt, line: quoteLine } };
          cells.push(cell.trim());
          break;
        }
        const c = text[i];
        if (inQuote) {
          if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 2; continue; }
          if (c === '"') { inQuote = false; i++; continue; }
          if (c === "\n") line++;
          cell += c;
          i++;
          continue;
        }
        if (c === '"' && cell.trim() === "" && !literal.has(i)) { inQuote = true; quoteAt = i; quoteLine = line; cell = ""; i++; continue; }
        if (c === ",") { cells.push(cell.trim()); cell = ""; i++; continue; }
        if (c === "\n") { cells.push(cell.trim()); i++; line++; rowDone = true; continue; }
        cell += c;
        i++;
      }
      if (cells.length === 1 && cells[0] === "") blanks.push(start);
      else rows.push({ line: start, cells });
    }
    return { rows, blanks, unclosed: null };
  }

  // A row with the wrong number of values: explain the usual causes.
  function countProblem(problem, file, row, header) {
    const want = header.length, got = row.cells.length;
    const names = header.length <= 8 ? ` (${header.join(", ")})` : "";
    problem("error", file, row.line,
      `This row has ${plural(got, "value")}, but the first row names ${plural(want, "field")}${names}.`,
      got > want
        ? `Is there a comma inside a value, like Toys, Games and More? Put that whole value in "double quotes". Otherwise, remove the extra comma.`
        : `Every row needs a value for every field, in the same order as the first row. To leave one blank, write nothing between the commas: ,,`);
  }

  function blankWarnings(problem, file, parsed) {
    const last = parsed.rows.length ? parsed.rows[parsed.rows.length - 1].line : 0;
    const middle = parsed.blanks.filter((l) => l < last);
    if (middle.length) {
      problem("warning", file, middle[0],
        middle.length === 1 ? `Line ${middle[0]} is blank.` : `${middle.length} lines are blank (lines ${middle.slice(0, 5).join(", ")}${middle.length > 5 ? ", …" : ""}).`,
        "The site skips blank lines, but GitHub's table view and other programs may not. Delete them.");
    }
  }

  // ---------- building the database ----------

  // files: [{ name: "collection.csv", text: "..." }]. Missing files are left out.
  function build(files) {
    const db = {
      settings: {}, settingLines: {}, fields: [], fieldByKey: {}, rows: [], byId: {},
      reviews: [], reviewsFor: {}, reviewers: [], problems: [], images: [],
      numberFields: new Set(), listFields: new Set(), files: files.map((f) => f.name),
    };
    const problem = (level, file, line, message, fix) => db.problems.push({ level, file, line, message, fix: fix || "" });
    const get = (name) => files.find((f) => f.name === name);

    readCollection(get("collection.csv"), db, problem);
    readSettings(get("settings.txt"), db, problem);
    readReviews(get("reviews.csv"), db, problem);
    findTypes(db, problem);

    const order = (p) => Math.max(0, FILES.indexOf(p.file)) * 100000 + p.line;
    db.problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1) || order(a) - order(b));
    return db;
  }

  function readCollection(f, db, problem) {
    const file = "collection.csv";
    if (!f) {
      problem("error", file, 0, "There's no data/collection.csv, so the collection is empty.",
        "Every collection needs data/collection.csv. Its first row names the fields, like id,title,year");
      return;
    }
    const parsed = parseCSV(f.text, file, problem);
    if (!parsed.rows.length) {
      problem("error", file, 1, "collection.csv is empty.", "The first row names the fields, like id,title,year. Each row after it is one item.");
      return;
    }
    const head = parsed.rows[0];
    const seen = {};
    head.cells.forEach((name, i) => {
      if (!name) {
        problem("error", file, head.line, `Field ${i + 1} in the first row has no name.`,
          "Give it a name, or delete the extra comma.");
        name = `field ${i + 1}`;
      }
      const key = norm(name);
      if (seen[key]) {
        problem("error", file, head.line, `There are two fields called ${name} in the first row.`,
          "Every field needs its own name. Rename one of them.");
        name = `${name} (${i + 1})`;
      }
      seen[norm(name)] = true;
      const field = { name, key: norm(name), index: i };
      db.fields.push(field);
      db.fieldByKey[field.key] = field;
    });
    const idField = db.fieldByKey.id;
    if (!idField) {
      problem("error", file, head.line, "The first row needs a field called id.",
        "Add id as the first field, and give every row a short, unique name like spirited-away. Reviews use it to point to a row.");
    }
    blankWarnings(problem, file, parsed);

    for (const r of parsed.rows.slice(1)) {
      const bad = r.cells.length !== db.fields.length;
      if (bad) countProblem(problem, file, r, db.fields.map((x) => x.name));
      const values = {};
      db.fields.forEach((fd) => { values[fd.name] = r.cells[fd.index] !== undefined ? r.cells[fd.index] : ""; });
      // A row with the wrong number of values is out of line, so its later
      // values land in the wrong fields. Don't pile more warnings onto it.
      const row = { line: r.line, id: "", values, bad };
      if (idField) {
        const id = values[idField.name];
        if (!id) {
          problem("error", file, r.line, "This row has no id.", "Give it a short, unique name in the id column, like my-favorite-thing.");
        } else if (!ID.test(id)) {
          const better = id.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          problem("error", file, r.line, `The id "${id}" can only use lowercase letters, numbers and dashes.`,
            better ? `Try ${better} instead. (No spaces or capital letters: ids are names for the computer, not for people.)` : "Use lowercase letters, numbers and dashes.");
        } else if (db.byId[id]) {
          problem("error", file, r.line, `The id ${id} is used twice: here and on line ${db.byId[id].line}.`,
            `Every row needs a different id, so reviews know which one they mean. Try ${id}-2.`);
        }
        row.id = id && ID.test(id) && !db.byId[id] ? id : "";
        if (row.id) db.byId[row.id] = row;
      }
      db.rows.push(row);
    }
    if (db.rows.length === 0) {
      problem("warning", file, head.line, "The collection has no rows yet, only the first row with the field names.",
        "Add one row for each item, with the values in the same order as the field names.");
    }
  }

  function readSettings(f, db, problem) {
    const file = "settings.txt";
    const s = db.settings, at = db.settingLines;
    if (f) {
      String(f.text || "").replace(/\r\n?/g, "\n").split("\n").forEach((raw, i) => {
        const text = raw.trim();
        const line = i + 1;
        if (!text || text.startsWith("#")) return;
        const m = text.match(/^([^:]+):(.*)$/);
        if (!m) {
          problem("error", file, line, `This line isn't a setting: "${text}".`,
            "Every setting is a name, a colon, then the value, like title: Movie Night. Notes start with #.");
          return;
        }
        const key = norm(m[1]);
        if (!SETTINGS.includes(key)) {
          const near = closest(key, SETTINGS);
          problem("error", file, line, `There's no setting called "${m[1].trim()}".`,
            near ? `Did you mean ${near}?` : `The settings are: ${SETTINGS.join(", ")}.`);
          return;
        }
        s[key] = m[2].trim();
        at[key] = line;
      });
    }

    const field = (key, name) => {
      const fd = db.fieldByKey[norm(name)];
      if (fd) return fd.name;
      if (db.fields.length) {
        const near = closest(name, db.fields.map((x) => x.name));
        problem("error", file, at[key] || 0, `${key}: ${name}. There's no field called ${name} in collection.csv.`,
          near ? `Did you mean ${near}?` : `The fields are: ${db.fields.map((x) => x.name).join(", ")}.`);
      }
      return null;
    };
    const fieldList = (key) => (s[key] || "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => field(key, x)).filter(Boolean);
    const plain = db.fields.filter((x) => x.key !== "id");
    const guess = (...names) => { for (const n of names) if (db.fieldByKey[n]) return db.fieldByKey[n].name; return null; };

    db.title = s.title || "Our Collection";
    db.tagline = s.tagline || "";
    db.by = s.by || "";
    db.about = s.about || "";
    db.items = s.items || "items";
    db.theme = norm(s.theme || "gallery");
    if (!THEMES.includes(db.theme)) {
      problem("error", file, at.theme, `There's no theme called ${s.theme}.`, `Pick one of: ${THEMES.join(", ")}.`);
      db.theme = "gallery";
    }
    db.shape = norm(s["card shape"] || "tall");
    if (!SHAPES.includes(db.shape)) {
      problem("error", file, at["card shape"], `There's no card shape called ${s["card shape"]}.`, `Pick one of: ${SHAPES.join(", ")}.`);
      db.shape = "tall";
    }
    db.cardTitle = s["card title"] ? field("card title", s["card title"]) : guess("title", "name");
    if (!db.cardTitle && plain.length) db.cardTitle = plain[0].name;
    db.cardSubtitle = s["card subtitle"] ? field("card subtitle", s["card subtitle"]) : null;
    db.cardImage = s["card image"] ? field("card image", s["card image"]) : guess("image", "picture", "photo");
    db.filters = fieldList("filters");
    db.sort = s.sort ? fieldList("sort") : (db.cardTitle ? [db.cardTitle] : []);
    db.search = s.search ? fieldList("search") : plain.map((x) => x.name);
    db.details = s.details ? fieldList("details") : plain.map((x) => x.name).filter((n) => n !== db.cardImage);
  }

  function readReviews(f, db, problem) {
    const file = "reviews.csv";
    if (!f) return;
    const parsed = parseCSV(f.text, file, problem);
    if (!parsed.rows.length) return;
    const head = parsed.rows[0];
    const col = {};
    head.cells.forEach((name, i) => { col[norm(name)] = i; });
    const missing = ["who", "item", "stars"].filter((k) => col[k] === undefined);
    if (missing.length) {
      problem("error", file, head.line, `The first row of reviews.csv needs the fields who, item and stars (it's missing ${listing(missing)}).`,
        "The first row should be: who,item,stars,comment");
      return;
    }
    blankWarnings(problem, file, parsed);
    const ids = Object.keys(db.byId);
    const seen = {};
    for (const r of parsed.rows.slice(1)) {
      const need = Math.max(col.who, col.item, col.stars) + 1;
      if (r.cells.length > head.cells.length || r.cells.length < need) countProblem(problem, file, r, head.cells);
      const who = (r.cells[col.who] || "").trim();
      const item = (r.cells[col.item] || "").trim();
      const starsText = (r.cells[col.stars] || "").trim();
      const comment = col.comment !== undefined ? (r.cells[col.comment] || "").trim() : "";
      if (!who) problem("warning", file, r.line, "This review doesn't say who wrote it.", "Put a name in the who column.");
      let ok = true;
      if (!item) {
        problem("error", file, r.line, "This review doesn't say which item it's about.", "Put the item's id (from collection.csv) in the item column.");
        ok = false;
      } else if (!db.byId[item]) {
        const near = closest(item, ids);
        problem("error", file, r.line, `This review is about ${item}, but no row in collection.csv has the id ${item}.`,
          near ? `Did you mean ${near}? (That's line ${db.byId[near].line} of collection.csv.)` : "Use the id from the first column of collection.csv, exactly as it's spelled there.");
        ok = false;
      }
      const stars = Number(starsText);
      if (!/^[1-5]$/.test(starsText)) {
        problem("error", file, r.line, `Stars must be a whole number from 1 to 5, but this review says "${starsText}".`,
          "Write just the number, like 4.");
        ok = false;
      }
      if (!ok) continue;
      const key = norm(who) + "|" + item;
      if (seen[key]) {
        problem("warning", file, r.line, `${who || "Someone"} reviewed ${item} twice (lines ${seen[key].line} and ${r.line}).`,
          "Only the last one counts. Delete the one you don't want.");
        db.reviews.splice(db.reviews.indexOf(seen[key]), 1);
      }
      const review = { line: r.line, who: who || "Someone", item, stars, comment };
      seen[key] = review;
      db.reviews.push(review);
    }
    for (const rv of db.reviews) (db.reviewsFor[rv.item] = db.reviewsFor[rv.item] || []).push(rv);
    db.reviewers = [...new Set(db.reviews.map((rv) => rv.who))];
  }

  // Which fields hold numbers and which hold lists. Then look for values that
  // were probably meant to be the same, like "comedy" and "Comedy".
  function findTypes(db, problem) {
    const file = "collection.csv";
    for (const fd of db.fields) {
      if (fd.key === "id") continue;
      const filled = db.rows.filter((r) => r.values[fd.name] !== "");
      const nums = filled.filter((r) => isNumber(r.values[fd.name]));
      if (filled.length && nums.length >= 2 && nums.length / filled.length >= 0.6) {
        db.numberFields.add(fd.name);
        for (const r of filled) {
          if (r.bad || isNumber(r.values[fd.name])) continue;
          problem("warning", file, r.line, `${fd.name} holds numbers, but this row says "${r.values[fd.name]}".`,
            `Write just the number, like ${nums[0].values[fd.name]}. Otherwise sorting and Ask the database get this row wrong.`);
        }
      }
      if (filled.some((r) => r.values[fd.name].includes(";"))) db.listFields.add(fd.name);
    }
    for (const r of db.rows) {
      if (r.bad) continue;
      if (db.cardTitle && r.values[db.cardTitle] === "") {
        problem("warning", file, r.line, `This row has no ${db.cardTitle}, so its card will be blank.`, `Fill in the ${db.cardTitle} column.`);
      }
      if (db.cardImage && r.values[db.cardImage]) db.images.push({ src: r.values[db.cardImage], file, line: r.line, id: r.id });
    }
    const check = new Set(db.filters.concat([...db.listFields]));
    for (const name of check) {
      if (db.numberFields.has(name)) continue;
      const spellings = {};
      for (const r of db.rows) {
        for (const v of values(db, r, name)) {
          const k = norm(v);
          spellings[k] = spellings[k] || {};
          (spellings[k][v] = spellings[k][v] || []).push(r.line);
        }
      }
      for (const k of Object.keys(spellings)) {
        const forms = Object.keys(spellings[k]);
        if (forms.length < 2) continue;
        forms.sort((a, b) => spellings[k][b].length - spellings[k][a].length);
        const odd = forms.slice(1);
        problem("warning", file, spellings[k][odd[0]][0],
          `In ${name}, ${odd.map((x) => `"${x}"`).join(", ")} and "${forms[0]}" look like the same thing, but the computer treats them as different values.`,
          `Spell it "${forms[0]}" everywhere (look on line${spellings[k][odd[0]].length > 1 ? "s" : ""} ${spellings[k][odd[0]].join(", ")}), or the ${forms[0]} filter will miss some rows.`);
      }
    }
  }

  // ---------- using the database ----------

  // The values in one field of a row: a list field gives several.
  function values(db, row, field) {
    const v = row.values[field] || "";
    if (!v) return [];
    return db.listFields.has(field) ? v.split(";").map((x) => x.trim()).filter(Boolean) : [v];
  }

  function average(db, id) {
    const list = db.reviewsFor[id] || [];
    return list.length ? list.reduce((t, r) => t + r.stars, 0) / list.length : null;
  }

  function sortRows(db, rows, field, dir) {
    const out = rows.slice();
    if (!field) return dir === "down" ? out.reverse() : out;
    const get = field === STARS ? (r) => average(db, r.id) : (r) => r.values[field];
    const num = field === STARS || db.numberFields.has(field);
    out.sort((a, b) => {
      const x = get(a), y = get(b);
      const xe = x === null || x === "" || (num && isNaN(toNumber(x)));
      const ye = y === null || y === "" || (num && isNaN(toNumber(y)));
      if (xe || ye) return xe === ye ? 0 : xe ? 1 : -1; // blanks always last
      const c = num ? toNumber(x) - toNumber(y) : String(x).localeCompare(String(y), undefined, { sensitivity: "base", numeric: true });
      return dir === "down" ? -c : c;
    });
    return out;
  }

  // "If you liked this…": items that share filter values (like a genre or a
  // director) score a point for each shared value, plus a point for each
  // person who gave both items 4 or 5 stars.
  function recommend(db, id, howMany = 4) {
    const a = db.byId[id];
    if (!a) return [];
    const fields = db.filters.length ? db.filters : [...db.listFields];
    const loved = (rid) => new Set((db.reviewsFor[rid] || []).filter((r) => r.stars >= 4).map((r) => r.who));
    const aLoved = loved(id);
    const out = [];
    for (const b of db.rows) {
      if (!b.id || b.id === id) continue;
      const shared = [];
      for (const f of fields) {
        const mine = new Set(values(db, a, f).map(norm));
        for (const v of values(db, b, f)) if (mine.has(norm(v))) shared.push(v);
      }
      const people = [...loved(b.id)].filter((w) => aLoved.has(w));
      const score = shared.length + people.length;
      if (!score) continue;
      const why = [];
      if (shared.length) why.push("Also " + listing(shared.slice(0, 3)));
      if (people.length) why.push(people.length > 3 ? `${people.length} people loved both` : `${listing(people)} loved both`);
      out.push({ row: b, score, why: why.join(" · ") });
    }
    out.sort((x, y) => y.score - x.score || (average(db, y.row.id) || 0) - (average(db, x.row.id) || 0));
    return out.slice(0, howMany);
  }

  // ---------- Ask the database ----------

  const OPS = { is: "is", contains: "contains", more: "is more than", less: "is less than" };

  function sqlName(f) {
    if (f === STARS) return "average_stars";
    return /^[a-z_][a-z0-9_]*$/i.test(f) ? f : `"${f.replace(/"/g, '""')}"`;
  }
  function sqlValue(db, field, v) {
    if ((field === STARS || db.numberFields.has(field)) && isNumber(v)) return String(toNumber(v));
    return `'${String(v).replace(/'/g, "''")}'`;
  }

  function matches(db, row, c) {
    const v = String(c.value).trim();
    if (c.field === STARS) {
      const avg = average(db, row.id);
      if (avg === null || !isNumber(v)) return false;
      const n = toNumber(v);
      return c.op === "more" ? avg > n : c.op === "less" ? avg < n : c.op === "is" ? Math.abs(avg - n) < 0.05 : String(avg.toFixed(1)).includes(v);
    }
    const cell = row.values[c.field] || "";
    const num = db.numberFields.has(c.field) && isNumber(v) && isNumber(cell);
    if (c.op === "contains") return norm(cell).includes(norm(v));
    if (c.op === "is") {
      if (num) return toNumber(cell) === toNumber(v);
      return values(db, row, c.field).some((x) => norm(x) === norm(v)) || norm(cell) === norm(v);
    }
    if (!cell) return false;
    const cmp = num ? toNumber(cell) - toNumber(v) : norm(cell).localeCompare(norm(v), undefined, { numeric: true });
    return c.op === "more" ? cmp > 0 : cmp < 0;
  }

  // q = { conds: [{ field, op, value }], sort: field or "", dir: "up" | "down" }
  function query(db, q) {
    const conds = (q.conds || []).filter((c) => c.field && c.op);
    let rows = db.rows.filter((r) => conds.every((c) => matches(db, r, c)));
    if (q.sort) rows = sortRows(db, rows, q.sort, q.dir);
    // The same question, written the way a real database (SQL) would ask it.
    const join = q.sort === STARS || conds.some((c) => c.field === STARS);
    const where = conds.filter((c) => c.field !== STARS), having = conds.filter((c) => c.field === STARS);
    const cond = (c) => {
      const name = sqlName(c.field);
      if (c.op === "contains" || (c.op === "is" && db.listFields.has(c.field))) return `${name} LIKE '%${String(c.value).trim().replace(/'/g, "''")}%'`;
      return `${name} ${c.op === "is" ? "=" : c.op === "more" ? ">" : "<"} ${sqlValue(db, c.field, String(c.value).trim())}`;
    };
    const sql = [join ? "SELECT collection.*, AVG(reviews.stars) AS average_stars" : "SELECT *", "FROM collection"];
    if (join) sql.push("LEFT JOIN reviews ON reviews.item = collection.id");
    if (where.length) sql.push("WHERE " + where.map(cond).join("\n  AND "));
    if (join) sql.push("GROUP BY collection.id");
    if (having.length) sql.push("HAVING " + having.map(cond).join("\n  AND "));
    if (q.sort) sql.push(`ORDER BY ${sqlName(q.sort)} ${q.dir === "down" ? "DESC" : "ASC"}`);
    return { rows, sql: sql.join("\n") + ";" };
  }

  // How many items have each value of a field. Numbers with lots of different
  // values are grouped into ranges, like 1980–1989.
  function countBy(db, field) {
    const groups = new Map();
    const add = (label, row, order) => {
      if (!groups.has(label)) groups.set(label, { label, count: 0, stars: [], order });
      const g = groups.get(label);
      g.count++;
      for (const rv of db.reviewsFor[row.id] || []) g.stars.push(rv.stars);
    };
    let sql, width = 0;
    const isNum = db.numberFields.has(field);
    const nums = isNum ? db.rows.map((r) => r.values[field]).filter(isNumber).map(toNumber) : [];
    if (isNum && new Set(nums).size > 12) {
      const span = Math.max(...nums) - Math.min(...nums);
      width = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 5000, 10000].find((w) => span / w <= 10) || 100000;
    }
    for (const r of db.rows) {
      const vs = values(db, r, field);
      if (!vs.length) { add("(blank)", r, Infinity); continue; }
      for (const v of vs) {
        if (width && isNumber(v)) {
          const lo = Math.floor(toNumber(v) / width) * width;
          add(width === 1 ? String(lo) : `${lo}–${lo + width - 1}`, r, lo);
        } else {
          add(v, r, isNum && isNumber(v) ? toNumber(v) : 0);
        }
      }
    }
    const list = [...groups.values()].map((g) => ({
      label: g.label, count: g.count, order: g.order,
      stars: g.stars.length ? g.stars.reduce((a, b) => a + b, 0) / g.stars.length : null,
    }));
    if (isNum) list.sort((a, b) => a.order - b.order);
    else list.sort((a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label)));
    const name = sqlName(field);
    sql = width
      ? `SELECT FLOOR(${name} / ${width}) * ${width} AS ${field.replace(/\W+/g, "_")}_group, COUNT(*) AS how_many\nFROM collection\nGROUP BY ${field.replace(/\W+/g, "_")}_group\nORDER BY ${field.replace(/\W+/g, "_")}_group;`
      : `SELECT ${name}, COUNT(*) AS how_many\nFROM collection\nGROUP BY ${name}\nORDER BY how_many DESC;`;
    return { groups: list, sql, list: db.listFields.has(field), width };
  }

  return { FILES, SETTINGS, THEMES, SHAPES, STARS, OPS, build, parseCSV, closest, values, average, sortRows, recommend, query, countBy, isNumber, norm };
})();

if (typeof module !== "undefined") module.exports = Database;
