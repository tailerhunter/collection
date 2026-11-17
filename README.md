# Collection

A website for a collection your team cares about: movies, sneakers, video
games, recipes, houseplants, anything. Visitors can search it, filter it, sort
it, open any item to read your reviews, and get "if you liked this…"
recommendations.

The website is already built. Your team builds the **database** behind it:
a table of items in a plain-text file, one row per item. Change the table,
and the website changes with it. **No programming needed.**

**See it working first:** [open the sample collection](https://emenriquez.github.io/cs1101-collection/).

> **Start here.** Read this page top to bottom once. It takes five minutes.

---

## 1. Set up your team's copy (Day 1)

### One person: the owner

Pick one teammate to own the repository. Everyone else will work in it too.

1. Near the top of this page, click **Use this template** → **Create a new repository**.
2. Name it `collection`, set it to **Public**, and click **Create repository**.
3. **Turn on the live link.** In the new repository: **Settings** → **Pages** →
   under **Branch** choose `main` and `/ (root)` → **Save**. About a minute
   later, the website is live at `https://OWNER-USERNAME.github.io/collection/`.
4. **Invite your teammates.** **Settings** → **Collaborators** →
   **Add people** → type a teammate's GitHub username → **Add**. Repeat for
   each teammate. (GitHub may ask for your password first.)

### Everyone else

1. Open `https://github.com/OWNER-USERNAME/collection/invitations` (use the
   owner's username) and click **Accept invitation**. The same invitation is
   also in your email.
2. Bookmark the team's repository and the live link.

---

## 2. Ways to split the work

Your collection lives in the `data` folder:

| File | What it is |
| --- | --- |
| `data/collection.csv` | the main table: one row per item, one column per field |
| `data/reviews.csv` | a second table: who reviewed which item, and how many stars |
| `data/settings.txt` | the title, the theme, and which fields show up where |
| `images/` | pictures of your items |

Everyone adds items and reviews: it's the whole team's collection. Beyond
that, here are some ways to divide things up. They're suggestions, not rules.

- **2 people:** a *designer* (chooses the fields, sets up `settings.txt`,
  picks the look) and a *collector* (finds the items and their pictures).
- **3 people:** add a *critic* (makes sure everything is reviewed, checks
  that the recommendations make sense, finds facts with **Ask the database**).
- **4 people:** add a *data detective* (keeps the data clean and consistent,
  and tests the site on people outside your team).

**Everyone's first change:** add one review to `data/reviews.csv` (any item
in the sample is fine), and get it merged with a pull request (next section).

---

## 3. How to change things: a pull request

On a team, nobody changes `main` directly. `main` is what the live link
shows, so it's the version everyone shares. Instead you **propose** a change,
a teammate **reviews** it, and then it's **merged** into `main`. That's a
**pull request**, and almost every software team in the world works this way.

### Making a pull request

1. Open the file (for example `data/collection.csv`) and click the **pencil**
   icon (*Edit this file*). GitHub shows a `.csv` file as a neat table, but
   when you edit it, you see the plain text: values separated by commas.
2. Make your change.
3. **Test it first** (recommended): select everything in the editor
   (<kbd>Ctrl</kbd>+<kbd>A</kbd>, or <kbd>⌘</kbd>+<kbd>A</kbd> on a Mac), copy
   it, then open your team's live link and click **Test a draft**. See section 5.
4. Back in GitHub, click **Commit changes...**. Write a message that says
   what you changed, like `Add five sneakers from the 90s`.
5. Choose **Create a new branch for this commit and start a pull request**,
   then click **Propose changes**.
6. On the next page, fill in the description and click **Create pull request**.
7. Wait about 30 seconds for the **Collection check** at the bottom of the page.
   - ✓ green: the check found nothing wrong. Ask a teammate to review.
   - ✗ red: click **Details** to see what to fix. To fix it, go to the
     **Files changed** tab, click the **⋯** menu on your file → **Edit file**,
     and commit again. Your fix goes into the same pull request.

> **Tip:** rows can go anywhere in `collection.csv`. If two people add rows
> at the *very end* at the same time, GitHub can't tell which should go
> first, and you get a conflict (section 6). Adding your rows in different
> places, like in alphabetical order, avoids that.

### Reviewing a teammate's pull request

1. Open the **Pull requests** tab and click their pull request.
2. Click **Files changed** and read every line. Green lines were added; red
   lines were removed.
3. **Try it.** On the file's **⋯** menu, click **View file**, then the
   **Copy raw file** button. Paste it into **Test a draft** on the live link.
4. Click **Review changes** (or **Submit review**). Choose:
   - **Approve** if it's ready, or
   - **Request changes** if something is wrong, with a comment that says
     exactly what and where, so the writer can fix it.
5. Once it's approved, open the **Conversation** tab and click
   **Merge pull request** → **Confirm merge**. The live link updates about a
   minute later.

Don't merge your own pull request until a teammate has approved it.

---

## 4. The data cheat sheet

### `collection.csv`: the main table

```text
id,title,year,genre,director,runtime,image
coco,Coco,2017,Animation; Musical,Lee Unkrich,105,
up,Up,2009,Animation; Adventure,Pete Docter,96,images/up.jpg
```

- **The first row names the fields** (the columns). Every row after it is one
  item, with its values **in the same order**, separated by commas.
- **You choose the fields.** Rename them, add new ones, delete ones you don't
  need. A sneaker collection might use `id,name,brand,year,price,colors,image`.
- **`id` is required.** It's a short name for each row that the computer uses:
  lowercase letters, numbers and dashes, like `air-max-90`. No two rows can
  have the same id. Reviews use it to point to a row.
- **A blank value** is nothing between two commas: `coco,Coco,2017,,Lee Unkrich,105,`
- **A value with a comma in it** goes in double quotes: `"Toys, Games and More"`.
- **A list of values** (like several genres) uses semicolons: `Animation; Musical`.
- **Numbers** are just the number: `105`, not `105 minutes`. Prices can have a
  dollar sign: `$89.99`. Then sorting and **Ask the database** treat them as numbers.
- **Pictures** go in the `images` folder (**Add file** → **Upload files**).
  Put the path in the picture field: `images/up.jpg`. Spell it exactly,
  including capital letters. Items with no picture get a colorful cover made
  from their title.
- **Links** (anything starting with `https://`) show up as clickable links on
  the item's page.

### `reviews.csv`: the second table

```text
who,item,stars,comment
Ana,coco,5,"Made me cry, then made me dance."
Ben,coco,3,Pretty but not really my thing.
```

- `who`: your name. `item`: the **id** of a row in `collection.csv`.
  `stars`: a whole number from 1 to 5. `comment`: optional.
- Each review points to a row in the other table. That link between two
  tables is what makes this a real database.

### `settings.txt`: how the website looks

| Setting | Example | What it does |
| --- | --- | --- |
| `title` | `title: Sneaker Vault` | the big title at the top |
| `tagline` | `tagline: Every shoe we wish we owned` | the line under the title |
| `by` | `by: Ana, Ben and Cam` | your names |
| `about` | `about: Click a shoe to see what we think of it.` | a short paragraph under that |
| `theme` | `theme: night` | `gallery`, `night`, `retro` or `garden` |
| `items` | `items: sneakers` | what to call your things ("Showing 12 of 30 sneakers") |
| `card title` | `card title: name` | the field shown in big letters on each card |
| `card subtitle` | `card subtitle: brand` | the field shown under it |
| `card image` | `card image: image` | the field with each item's picture |
| `card shape` | `card shape: square` | `tall` (like a poster), `square`, or `wide` |
| `filters` | `filters: brand, colors` | a drop-down filter for each of these fields |
| `sort` | `sort: name, year, price` | the ways visitors can sort |
| `search` | `search: name, brand` | the fields the search box looks in |
| `details` | `details: brand, year, price, colors` | the fields on each item's page, in order |

Lines that start with `#` are notes. The website ignores them.

---

## 5. Tools on the live site

| Button | Does |
| --- | --- |
| **🎲 Surprise me** | opens a random item (from the ones currently showing) |
| **Ask the database** | ask a question, like "runtime is more than 120, sorted by year", and see the answer and the same question in SQL. **Count by** draws a bar chart. |
| **Test a draft** | paste a data file you're still editing and see the website with it, without committing anything. **Start from the current file** loads what's on the site now, so you can make changes right there and **Copy my draft** back into GitHub. |
| **✓ No problems** / **⚠ problems** | lists every mistake the engine found, with the file, the line, and how to fix it |

Click any card to open its page: details, reviews, and recommendations.
Click a value like *Animation* to show every item with it. Keys: <kbd>/</kbd>
search, <kbd>←</kbd> <kbd>→</kbd> previous and next item, <kbd>Esc</kbd> close.
Every item's page has its own link (it ends in `#` and the id), so you can
share it.

---

## 6. When something goes wrong

- The **problems** button turns red when the data has a mistake. It tells you
  the file, the line, and the usual fix. Fix the first one, then check again.
- The **Collection check** on every pull request runs the same checks, so
  mistakes get caught before they reach `main`.
- A merged pull request broke something? Open it and click **Revert**. That
  makes a new pull request that undoes it.

### "This branch has conflicts that must be resolved"

Two pull requests changed the same lines, and GitHub can't tell which one you
want. That happens a lot with a shared table. It's normal, and it's fixable:

1. Click **Resolve conflicts**.
2. GitHub shows both versions between markers: `<<<<<<<` (your branch),
   `=======`, and `>>>>>>>` (main).
3. Edit the text so it says what you actually want. With new rows, that's
   usually **keep both**.
4. Delete the three marker lines, then click **Mark as resolved** →
   **Commit merge**. The check runs again.

---

## More

- [CHALLENGES.md](CHALLENGES.md): your first steps, and challenges to make the collection your own.
- [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md): how a database works, and how this one answers questions and recommends things.
- [docs/IDEAS.md](docs/IDEAS.md): **optional** bigger features, if your team wants to go further.
- Found something that doesn't work right? **Issues** → **New issue** → **Bug report**.
