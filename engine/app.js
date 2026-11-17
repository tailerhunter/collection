/* Engine: the website. Loads the files in data/, shows the gallery, the
   item pages, "Ask the database", and the problems list.
   You don't need to edit this file. */

const App = (() => {
  const $ = (id) => document.getElementById(id);
  const D = Database;
  const S = { db: null, live: [], files: [], draft: null, imageProblems: [], shown: [], open: null, ready: false,
    ask: null };

  // ---------- loading ----------

  async function load() {
    const fresh = "?v=" + Date.now();
    const found = await Promise.all(D.FILES.map(async (name) => {
      try {
        const r = await fetch("data/" + name + fresh);
        return r.ok ? { name, text: await r.text() } : null;
      } catch (e) {
        return null;
      }
    }));
    return found.filter(Boolean);
  }

  function rebuild(files) {
    S.files = files;
    S.db = D.build(files);
    S.imageProblems = [];
    const db = S.db;
    document.body.className = "theme-" + db.theme + " shape-" + db.shape;
    document.title = db.title;
    $("title").textContent = db.title;
    show("tagline", db.tagline);
    show("byline", db.by ? "by " + db.by : "");
    show("about", db.about);
    $("search").placeholder = `Search ${db.items}…`;
    checkImages();
    buildControls();
    renderGrid();
    showBadge();
  }

  function show(id, text) {
    $(id).textContent = text;
    $(id).hidden = !text;
  }

  // Pictures can only be checked by trying to load them.
  function checkImages() {
    const db = S.db;
    const seen = new Set();
    for (const im of db.images) {
      if (seen.has(im.src)) continue;
      seen.add(im.src);
      const probe = new Image();
      probe.onerror = () => {
        if (S.db !== db) return;
        S.imageProblems.push({ level: "error", file: im.file, line: im.line,
          message: `The picture ${im.src} can't be found.`,
          fix: "Check the spelling and the capital letters: on the web, Coco.jpg and coco.jpg are two different files. Pictures go in the images folder, and the value should start with images/" });
        showBadge();
      };
      probe.src = im.src;
    }
  }

  function problems() {
    const rank = (p) => (p.level === "error" ? 0 : 1e7) + Math.max(0, D.FILES.indexOf(p.file)) * 1e5 + p.line;
    return S.db.problems.concat(S.imageProblems).sort((a, b) => rank(a) - rank(b));
  }

  // ---------- search, filters and sorting ----------

  function buildControls() {
    const db = S.db;
    const box = $("filters");
    const old = {};
    for (const sel of box.querySelectorAll("select")) old[sel.dataset.field] = sel.value;
    box.innerHTML = "";
    for (const field of db.filters) {
      const counts = new Map();
      for (const r of db.rows) for (const v of D.values(db, r, field)) counts.set(v, (counts.get(v) || 0) + 1);
      let vals = [...counts.keys()];
      vals = db.numberFields.has(field)
        ? vals.sort((a, b) => parseFloat(a.replace("$", "")) - parseFloat(b.replace("$", "")))
        : vals.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      const label = document.createElement("label");
      label.innerHTML = `<span class="label">${esc(field)}</span> `;
      const sel = document.createElement("select");
      sel.dataset.field = field;
      sel.appendChild(new Option(`Any ${field}`, ""));
      for (const v of vals) sel.appendChild(new Option(`${v} (${counts.get(v)})`, v));
      sel.value = vals.includes(old[field]) ? old[field] : "";
      sel.onchange = renderGrid;
      label.appendChild(sel);
      box.appendChild(label);
    }
    const sort = $("sort");
    const was = sort.value;
    sort.innerHTML = "";
    for (const f of db.sort) {
      if (db.numberFields.has(f)) {
        sort.appendChild(new Option(`${f} (low to high)`, f + "|up"));
        sort.appendChild(new Option(`${f} (high to low)`, f + "|down"));
      } else {
        sort.appendChild(new Option(`${f} (A to Z)`, f + "|up"));
        sort.appendChild(new Option(`${f} (Z to A)`, f + "|down"));
      }
    }
    if (db.reviews.length) sort.appendChild(new Option("average stars (best first)", D.STARS + "|down"));
    sort.appendChild(new Option("order in the file", "|up"));
    sort.value = [...sort.options].some((o) => o.value === was) ? was : sort.options[0].value;
  }

  function currentRows() {
    const db = S.db;
    const q = D.norm($("search").value);
    let rows = db.rows;
    if (q) rows = rows.filter((r) => db.search.some((f) => D.norm(r.values[f] || "").includes(q)));
    for (const sel of $("filters").querySelectorAll("select")) {
      if (!sel.value) continue;
      const want = D.norm(sel.value);
      rows = rows.filter((r) => D.values(db, r, sel.dataset.field).some((v) => D.norm(v) === want));
    }
    const [field, dir] = $("sort").value.split("|");
    return D.sortRows(db, rows, field, dir);
  }

  function filtered() {
    return !!$("search").value.trim() || [...$("filters").querySelectorAll("select")].some((s) => s.value);
  }

  function clearFilters() {
    $("search").value = "";
    for (const sel of $("filters").querySelectorAll("select")) sel.value = "";
    renderGrid();
  }

  // ---------- the gallery ----------

  function renderGrid() {
    const db = S.db;
    S.shown = currentRows();
    const grid = $("grid");
    grid.innerHTML = "";
    const count = $("count");
    count.innerHTML = `Showing ${S.shown.length} of ${db.rows.length} ${esc(db.items)}`;
    if (filtered()) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "link";
      b.textContent = "Show everything";
      b.onclick = clearFilters;
      count.append(" · ", b);
    }
    if (!db.rows.length) {
      grid.innerHTML = `<p class="empty">There's nothing in the collection yet. Open <strong>Problems</strong> above to see why, or add rows to <code>data/collection.csv</code>.</p>`;
      return;
    }
    if (!S.shown.length) {
      grid.innerHTML = `<p class="empty">Nothing matches. Try a different search, or click <strong>Show everything</strong>.</p>`;
      return;
    }
    for (const r of S.shown) grid.appendChild(card(r));
  }

  function card(r) {
    const db = S.db;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.dataset.id = r.id;
    b.appendChild(cover(r));
    const t = document.createElement("span");
    t.className = "card-title";
    t.textContent = (db.cardTitle && r.values[db.cardTitle]) || r.id || "(no title)";
    b.appendChild(t);
    const sub = db.cardSubtitle ? r.values[db.cardSubtitle] : "";
    const avg = D.average(db, r.id);
    if (sub || avg !== null) {
      const s = document.createElement("span");
      s.className = "card-sub";
      s.textContent = [sub, avg !== null ? "★ " + avg.toFixed(1) : ""].filter(Boolean).join(" · ");
      b.appendChild(s);
    }
    b.onclick = () => openItem(r);
    return b;
  }

  // A cover: the picture if there is one, otherwise one made from the title.
  function cover(r, big) {
    const db = S.db;
    const wrap = document.createElement("span");
    wrap.className = "cover" + (big ? " big" : "");
    const src = db.cardImage ? r.values[db.cardImage] : "";
    const title = (db.cardTitle && r.values[db.cardTitle]) || r.id || "?";
    const made = () => {
      const words = title.replace(/[^\p{L}\p{N}\s-]/gu, "").split(/[\s-]+/).filter((w) => w && !/^(the|a|an|of|and)$/i.test(w));
      const initials = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || title).slice(0, 2);
      let h = 0;
      for (const c of r.id || title) h = (h * 31 + c.charCodeAt(0)) % 360;
      const g = document.createElement("span");
      g.className = "made";
      g.style.setProperty("--h", h);
      g.textContent = initials.toUpperCase();
      return g;
    };
    const flag = (text) => {
      wrap.classList.add("missing");
      const note = document.createElement("span");
      note.className = "missing-note";
      note.textContent = text;
      wrap.appendChild(note);
    };
    if (r.bad) {
      // Its values are in the wrong fields, so don't trust its picture either.
      wrap.appendChild(made());
      flag("This row has a problem");
    } else if (src) {
      const img = document.createElement("img");
      img.alt = title;
      img.loading = "lazy";
      img.onerror = () => {
        wrap.innerHTML = "";
        wrap.appendChild(made());
        flag("Picture not found");
      };
      img.src = src;
      wrap.appendChild(img);
    } else {
      wrap.appendChild(made());
    }
    return wrap;
  }

  function stars(n) {
    const full = Math.round(n);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  // ---------- one item's page ----------

  function openItem(r) {
    const db = S.db;
    S.open = r;
    const body = document.createElement("div");
    body.className = "item";
    const top = document.createElement("div");
    top.className = "item-top";
    top.appendChild(cover(r, true));
    const info = document.createElement("div");
    info.className = "item-info";
    const reviews = db.reviewsFor[r.id] || [];
    const avg = D.average(db, r.id);
    if (avg !== null) {
      const p = document.createElement("p");
      p.className = "item-stars";
      p.innerHTML = `<span class="stars" aria-label="${avg.toFixed(1)} stars">${stars(avg)}</span> ${avg.toFixed(1)} from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`;
      info.appendChild(p);
    }
    const dl = document.createElement("dl");
    for (const f of db.details) {
      const vals = D.values(db, r, f);
      if (!vals.length) continue;
      const dt = document.createElement("dt");
      dt.textContent = f;
      const dd = document.createElement("dd");
      for (const v of vals) {
        if (/^https?:\/\/\S+$/i.test(v)) {
          const a = document.createElement("a");
          a.href = v;
          a.target = "_blank";
          a.rel = "noopener";
          let host = v;
          try { host = new URL(v).hostname.replace(/^www\./, ""); } catch (e) { /* not a real link */ }
          a.textContent = host + " ↗";
          dd.appendChild(a);
        } else if (db.filters.includes(f)) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "chip";
          chip.textContent = v;
          chip.title = `Show every ${f}: ${v}`;
          chip.onclick = () => { filterBy(f, v); };
          dd.appendChild(chip);
        } else {
          const span = document.createElement("span");
          span.className = vals.length > 1 ? "chip plain" : "";
          span.textContent = v;
          dd.appendChild(span);
        }
      }
      dl.append(dt, dd);
    }
    info.appendChild(dl);
    const where = document.createElement("p");
    where.className = "row-note";
    where.innerHTML = `This is the row with id <code>${esc(r.id || "(none)")}</code>, on line ${r.line} of <code>data/collection.csv</code>.`;
    info.appendChild(where);
    top.appendChild(info);
    body.appendChild(top);

    if (db.reviews.length) {
      const h = document.createElement("h3");
      h.textContent = "Reviews";
      body.appendChild(h);
      if (!reviews.length) {
        const p = document.createElement("p");
        p.className = "muted";
        p.innerHTML = `No reviews yet. Add one to <code>data/reviews.csv</code> with <code>${esc(r.id)}</code> in the item column.`;
        body.appendChild(p);
      }
      const ul = document.createElement("ul");
      ul.className = "reviews";
      for (const rv of reviews) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="who">${esc(rv.who)}</span> <span class="stars">${stars(rv.stars)}</span>${rv.comment ? `<span class="comment">${esc(rv.comment)}</span>` : ""}`;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }

    const h = document.createElement("h3");
    h.textContent = "If you liked this…";
    body.appendChild(h);
    const recs = D.recommend(db, r.id);
    if (!recs.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = `Nothing similar yet. Recommendations come from shared ${db.filters.length ? listing(db.filters) : "values"} and from reviews.`;
      body.appendChild(p);
    } else {
      const ul = document.createElement("ul");
      ul.className = "recs";
      for (const rec of recs) {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        b.appendChild(cover(rec.row));
        const text = document.createElement("span");
        text.innerHTML = `<strong>${esc(rec.row.values[db.cardTitle] || rec.row.id)}</strong><small>${esc(rec.why)}</small>`;
        b.appendChild(text);
        b.onclick = () => openItem(rec.row);
        li.appendChild(b);
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }

    const i = S.shown.indexOf(r);
    if (i >= 0 && S.shown.length > 1) {
      const nav = document.createElement("div");
      nav.className = "item-nav";
      const prev = S.shown[(i - 1 + S.shown.length) % S.shown.length];
      const next = S.shown[(i + 1) % S.shown.length];
      nav.innerHTML = `<button type="button" id="item-prev">← ${esc(prev.values[db.cardTitle] || prev.id)}</button><span>${i + 1} of ${S.shown.length}</span><button type="button" id="item-next">${esc(next.values[db.cardTitle] || next.id)} →</button>`;
      body.appendChild(nav);
      nav.querySelector("#item-prev").onclick = () => openItem(prev);
      nav.querySelector("#item-next").onclick = () => openItem(next);
    }
    openPanel((db.cardTitle && r.values[db.cardTitle]) || r.id, body, true);
    $("panel-body").scrollTop = 0;
    $("panel").scrollTop = 0;
    if (r.id) history.replaceState(null, "", "#" + r.id);
  }

  function step(by) {
    if (!S.open) return;
    const i = S.shown.indexOf(S.open);
    if (i < 0 || S.shown.length < 2) return;
    openItem(S.shown[(i + by + S.shown.length) % S.shown.length]);
  }

  function filterBy(field, value) {
    closePanel();
    $("search").value = "";
    for (const sel of $("filters").querySelectorAll("select")) sel.value = sel.dataset.field === field ? value : "";
    renderGrid();
    $("controls").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function surprise() {
    const pool = S.shown.length ? S.shown : S.db.rows;
    if (pool.length) openItem(pool[Math.floor(Math.random() * pool.length)]);
  }

  // ---------- Ask the database ----------

  function fieldOptions(sel, withStars, blank) {
    const db = S.db;
    sel.innerHTML = "";
    if (blank) sel.appendChild(new Option(blank, ""));
    for (const f of db.fields) if (f.key !== "id") sel.appendChild(new Option(f.name, f.name));
    if (withStars && db.reviews.length) sel.appendChild(new Option("average stars", D.STARS));
  }

  function askPanel() {
    const db = S.db;
    const body = document.createElement("div");
    body.className = "ask";
    const opOptions = Object.entries(D.OPS).map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    body.innerHTML = `
      <p>Your collection is a <strong>database</strong>: a table of rows (one per item) and fields (columns).
        Ask it a question by picking from the boxes, and it finds every row that fits.</p>
      <h3>Ask a question</h3>
      <div class="ask-form">
        <div class="ask-row"><span>Show the ${esc(db.items)} where</span>
          <select id="q-f1"></select><select id="q-o1">${opOptions}</select><input id="q-v1" list="q-l1" placeholder="a value"><datalist id="q-l1"></datalist></div>
        <div class="ask-row"><span>and</span>
          <select id="q-f2"></select><select id="q-o2">${opOptions}</select><input id="q-v2" list="q-l2" placeholder="a value"><datalist id="q-l2"></datalist></div>
        <div class="ask-row"><span>sorted by</span>
          <select id="q-sort"></select><select id="q-dir"><option value="up">low to high, A to Z</option><option value="down">high to low, Z to A</option></select></div>
      </div>
      <p class="ask-try" id="q-try"></p>
      <div id="q-answer"></div>
      <h3>Count by</h3>
      <div class="ask-row"><span>How many ${esc(db.items)} have each</span><select id="c-field"></select></div>
      <div id="c-answer"></div>`;
    openPanel("Ask the database", body, true);

    fieldOptions($("q-f1"), true, "(any row)");
    fieldOptions($("q-f2"), true, "(nothing else)");
    fieldOptions($("q-sort"), true, "order in the file");
    fieldOptions($("c-field"), false);
    const st = S.ask || {};
    // Keep the last question, so closing and reopening the panel doesn't lose it.
    const set = (id, v) => {
      if (v === undefined || v === null) return;
      const el = $(id);
      if (el.tagName === "SELECT" && ![...el.options].some((o) => o.value === v)) return;
      el.value = v;
    };
    set("q-f1", st.f1); set("q-o1", st.o1); set("q-v1", st.v1);
    set("q-f2", st.f2); set("q-o2", st.o2); set("q-v2", st.v2);
    set("q-sort", st.sort); set("q-dir", st.dir);
    set("c-field", st.count || db.filters[0]);
    for (const id of ["q-f1", "q-o1", "q-v1", "q-f2", "q-o2", "q-v2", "q-sort", "q-dir"]) {
      $(id).addEventListener("input", runQuery);
      $(id).addEventListener("change", runQuery);
    }
    $("c-field").onchange = runCount;

    const tries = examples();
    const tryBox = $("q-try");
    if (tries.length) {
      tryBox.append("Try: ");
      tries.forEach((ex, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = ex.label;
        b.onclick = () => {
          $("q-f1").value = ex.f1 || ""; $("q-o1").value = ex.o1 || "is"; $("q-v1").value = ex.v1 || "";
          $("q-f2").value = ""; $("q-v2").value = "";
          $("q-sort").value = ex.sort || ""; $("q-dir").value = ex.dir || "up";
          runQuery();
        };
        tryBox.appendChild(b);
        if (i < tries.length - 1) tryBox.append(" ");
      });
    }
    runQuery();
    runCount();
  }

  // Example questions made from whatever is in this collection.
  function examples() {
    const db = S.db;
    const out = [];
    const cat = db.filters.find((f) => !db.numberFields.has(f));
    if (cat) {
      const c = D.countBy(db, cat).groups.find((g) => g.label !== "(blank)");
      if (c) out.push({ label: `${cat} is ${c.label}`, f1: cat, o1: "is", v1: c.label, sort: db.cardTitle, dir: "up" });
    }
    // A number that isn't already on the cards makes a more interesting question.
    const num = [...db.numberFields].filter((f) => f !== db.cardTitle)
      .sort((a, b) => (a === db.cardSubtitle) - (b === db.cardSubtitle))[0];
    if (num) {
      const nums = db.rows.map((r) => r.values[num]).filter(D.isNumber).map((v) => parseFloat(v.replace("$", ""))).sort((a, b) => a - b);
      const raw = nums[Math.floor(nums.length * 0.75)];
      const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(raw) || 1)) - 1));
      const cut = Math.round(raw / mag) * mag;
      out.push({ label: `${num} more than ${cut}`, f1: num, o1: "more", v1: String(cut), sort: num, dir: "down" });
    }
    if (db.reviews.length) out.push({ label: "average stars more than 4", f1: D.STARS, o1: "more", v1: "4", sort: D.STARS, dir: "down" });
    return out;
  }

  function runQuery() {
    const db = S.db;
    const st = S.ask = Object.assign(S.ask || {}, {
      f1: $("q-f1").value, o1: $("q-o1").value, v1: $("q-v1").value,
      f2: $("q-f2").value, o2: $("q-o2").value, v2: $("q-v2").value,
      sort: $("q-sort").value, dir: $("q-dir").value,
    });
    fillValues("q-l1", st.f1);
    fillValues("q-l2", st.f2);
    for (const n of ["1", "2"]) {
      const on = !!$("q-f" + n).value;
      $("q-o" + n).disabled = !on;
      $("q-v" + n).disabled = !on;
    }
    const conds = [];
    if (st.f1) conds.push({ field: st.f1, op: st.o1, value: st.v1 });
    if (st.f2) conds.push({ field: st.f2, op: st.o2, value: st.v2 });
    const res = D.query(db, { conds, sort: st.sort, dir: st.dir });
    const show = [...new Set(conds.map((c) => c.field).concat(st.sort ? [st.sort] : []))].filter((f) => f !== db.cardTitle);
    const box = $("q-answer");
    box.innerHTML = `<p class="ask-answer"><strong>${res.rows.length} ${res.rows.length === 1 ? "row" : "rows"}</strong> ${res.rows.length === db.rows.length ? "(that's all of them)" : `out of ${db.rows.length}`}</p>`;
    const ol = document.createElement("ol");
    ol.className = "ask-results";
    for (const r of res.rows.slice(0, 60)) {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "link";
      b.textContent = r.values[db.cardTitle] || r.id;
      b.onclick = () => openItem(r);
      li.appendChild(b);
      const extra = show.map((f) => {
        if (f === D.STARS) { const a = D.average(db, r.id); return a === null ? "no reviews" : `★ ${a.toFixed(1)}`; }
        return `${f}: ${r.values[f] || "(blank)"}`;
      });
      if (extra.length) { const s = document.createElement("span"); s.textContent = " · " + extra.join(" · "); li.appendChild(s); }
      ol.appendChild(li);
    }
    box.appendChild(ol);
    if (res.rows.length > 60) box.insertAdjacentHTML("beforeend", `<p class="muted">…and ${res.rows.length - 60} more.</p>`);
    box.insertAdjacentHTML("beforeend", `<p class="sql-label">In a real database, this question is written in a language called <strong>SQL</strong>:</p><pre class="sql">${esc(res.sql)}</pre>`);
  }

  function fillValues(listId, field) {
    const db = S.db;
    const dl = $(listId);
    dl.innerHTML = "";
    if (!field || field === D.STARS) return;
    const vals = new Set();
    for (const r of db.rows) for (const v of D.values(db, r, field)) vals.add(v);
    for (const v of [...vals].slice(0, 200)) dl.appendChild(new Option(v));
  }

  function runCount() {
    const db = S.db;
    const field = $("c-field").value;
    S.ask = Object.assign(S.ask || {}, { count: field });
    const box = $("c-answer");
    if (!field) { box.innerHTML = ""; return; }
    const res = D.countBy(db, field);
    const max = Math.max(1, ...res.groups.map((g) => g.count));
    let html = `<div class="bars">`;
    for (const g of res.groups.slice(0, 40)) {
      html += `<div class="bar-row"><span class="bar-label">${esc(g.label)}</span>
        <span class="bar-track"><span class="bar" style="width:${(100 * g.count / max).toFixed(1)}%"></span></span>
        <span class="bar-count">${g.count}</span>
        <span class="bar-stars">${g.stars === null ? "" : "★ " + g.stars.toFixed(1)}</span></div>`;
    }
    html += `</div>`;
    if (res.groups.length > 40) html += `<p class="muted">…and ${res.groups.length - 40} more.</p>`;
    const notes = [];
    if (res.list) notes.push(`Some ${esc(db.items)} have more than one ${esc(field)}, so the counts add up to more than ${db.rows.length}.`);
    if (res.width) notes.push(`${esc(field)} has lots of different numbers, so they're grouped into ranges.`);
    if (db.reviews.length) notes.push("★ is the average of every review in that group, from <code>data/reviews.csv</code>.");
    if (notes.length) html += `<p class="muted">${notes.join(" ")}</p>`;
    html += `<p class="sql-label">In SQL:</p><pre class="sql">${esc(res.sql)}</pre>`;
    box.innerHTML = html;
  }

  // ---------- problems ----------

  function showBadge() {
    const all = problems();
    const errors = all.filter((p) => p.level === "error").length;
    const btn = $("btn-problems");
    btn.className = errors ? "bad" : all.length ? "warn" : "good";
    btn.textContent = all.length ? `⚠ ${all.length} problem${all.length === 1 ? "" : "s"}` : "✓ No problems";
  }

  function problemList(list) {
    const wrap = document.createElement("div");
    if (!list.length) {
      wrap.innerHTML = "<p class='all-good'>✓ No problems. Every row has the right number of values, every id is unique, and every review points to a real row.</p>";
      return wrap;
    }
    const intro = document.createElement("p");
    intro.textContent = "Red problems break part of the site. Yellow ones are probably mistakes. Fix the first one and check again: later problems are sometimes caused by earlier ones.";
    wrap.appendChild(intro);
    for (const p of list) {
      const card = document.createElement("div");
      card.className = "problem " + p.level;
      card.innerHTML = `<div class="where">data/${esc(p.file)}${p.line ? ", line " + p.line : ""}</div>
        <div class="what">${esc(p.message)}</div>${p.fix ? `<div class="fix">${esc(p.fix)}</div>` : ""}`;
      wrap.appendChild(card);
    }
    return wrap;
  }

  // ---------- panels ----------

  function openPanel(title, body, wide) {
    $("panel-title").textContent = title;
    const b = $("panel-body");
    b.innerHTML = "";
    b.appendChild(body);
    $("panel-box").className = wide ? "wide" : "";
    $("panel").hidden = false;
    $("panel-close").focus({ preventScroll: true });
  }

  function closePanel() {
    $("panel").hidden = true;
    S.open = null;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  // ---------- testing a draft ----------

  function testDraft(draft) {
    S.draft = draft;
    const files = S.live.filter((f) => f.name !== draft.as);
    files.push({ name: draft.as, text: draft.text });
    rebuild(files);
    closePanel();
    draftNotice();
  }

  function draftNotice() {
    const n = $("notice");
    n.innerHTML = `<strong>Previewing a draft</strong> of data/${esc(S.draft.as)}. Nothing is saved, and nobody else sees it.
      <button type="button" id="notice-edit">Edit the draft</button> <button type="button" id="notice-stop">Stop previewing</button>`;
    n.hidden = false;
    n.className = "draft";
    $("notice-edit").onclick = () => Draft.open(S.draft);
    $("notice-stop").onclick = stopDraft;
  }

  function stopDraft() {
    S.draft = null;
    $("notice").hidden = true;
    $("notice").className = "";
    rebuild(S.live);
  }

  // ---------- small helpers ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function listing(arr) {
    return arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
  }

  // ---------- start ----------

  function bind() {
    $("search").addEventListener("input", renderGrid);
    $("sort").onchange = renderGrid;
    $("btn-surprise").onclick = surprise;
    $("btn-ask").onclick = askPanel;
    $("btn-draft").onclick = () => Draft.open(S.draft);
    $("btn-problems").onclick = () => openPanel("Problems", problemList(problems()));
    $("panel-close").onclick = closePanel;
    $("panel").onclick = (e) => { if (e.target.id === "panel") closePanel(); };
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") { if (!$("panel").hidden) closePanel(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (S.open && e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (S.open && e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "/" && $("panel").hidden) { e.preventDefault(); $("search").focus(); }
    });
    addEventListener("hashchange", () => {
      const r = S.db && S.db.byId[decodeURIComponent(location.hash.slice(1))];
      if (r && S.open !== r) openItem(r);
    });
  }

  async function start() {
    bind();
    if (location.protocol === "file:") {
      $("title").textContent = "Open this from your live link";
      $("grid").innerHTML = "<p class='empty'>This website reads its data files from a web server, so double-clicking <code>index.html</code> won't work. Use your live link: <code>https://YOUR-USERNAME.github.io/collection/</code></p>";
      return;
    }
    S.live = await load();
    rebuild(S.live);
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && S.db.byId[id]) openItem(S.db.byId[id]);
    S.ready = true;
  }

  return { start, state: S, testDraft, stopDraft, openPanel, closePanel, problemList, problems, openItem, askPanel };
})();

window.addEventListener("load", App.start);
