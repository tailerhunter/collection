/* Engine: the draft tester. Paste a data file you're still editing and see
   the website with it, before you commit. You don't need to edit this file. */

const Draft = (() => {
  const SAVE = "collection-draft:" + location.pathname;

  function open(current) {
    let saved = current;
    if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(SAVE)); } catch (e) { saved = null; } }
    saved = saved || { as: "collection.csv", text: "" };

    const body = document.createElement("div");
    body.className = "draft-form";
    body.innerHTML = `
      <p>Paste a data file here to see the website with your changes. Nothing is saved to GitHub, and nobody else sees it.</p>
      <ol>
        <li>In GitHub, open the file and click the pencil to edit it. Select everything (<kbd>Ctrl</kbd>+<kbd>A</kbd>, or <kbd>⌘</kbd>+<kbd>A</kbd> on a Mac) and copy it.</li>
        <li>Paste it below, choose which file it is, and click <strong>Preview with my draft</strong>.</li>
        <li>When it looks right, go back to GitHub and commit. (Edited it here? Click <strong>Copy my draft</strong> and paste it into GitHub.)</li>
      </ol>
      <label>This draft is:
        <select id="draft-as"></select>
      </label>
      <textarea id="draft-text" spellcheck="false" placeholder="id,title,year&#10;my-thing,My Thing,2024"></textarea>
      <div class="draft-buttons">
        <button type="button" id="draft-go">Preview with my draft</button>
        <button type="button" id="draft-load">Start from the current file</button>
        <button type="button" id="draft-copy">Copy my draft</button>
      </div>`;
    const sel = body.querySelector("#draft-as");
    for (const f of Database.FILES) sel.appendChild(new Option("data/" + f, f));
    sel.value = saved.as;
    const text = body.querySelector("#draft-text");
    text.value = saved.text;

    const read = () => {
      const d = { as: sel.value, text: text.value };
      try { sessionStorage.setItem(SAVE, JSON.stringify(d)); } catch (e) { /* storage is off */ }
      return d;
    };
    body.querySelector("#draft-go").onclick = () => App.testDraft(read());
    body.querySelector("#draft-load").onclick = () => {
      const live = App.state.live.find((f) => f.name === sel.value);
      text.value = live ? live.text : "";
      read();
      text.focus();
    };
    const copy = body.querySelector("#draft-copy");
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text.value);
        copy.textContent = "Copied!";
      } catch (e) {
        text.select();
        copy.textContent = "Now press Ctrl+C";
      }
      setTimeout(() => { copy.textContent = "Copy my draft"; }, 2000);
    };
    if (current) {
      const mine = App.problems().filter((p) => p.file === current.as);
      const h = document.createElement("h3");
      h.textContent = mine.length ? "Problems in this draft" : "No problems in this draft";
      body.append(h, App.problemList(mine));
    }
    App.openPanel("Test a draft", body);
    text.focus();
  }

  return { open };
})();
