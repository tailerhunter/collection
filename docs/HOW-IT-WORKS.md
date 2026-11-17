# How it works

## The files

```text
index.html            the page: header, buttons, search box, grid
data/
  settings.txt        what the site is called and which fields go where
  collection.csv      the main table
  reviews.csv         the reviews table
images/               pictures
engine/               the code (about 1,500 lines; you don't need to edit it)
  database.js         reads the data files, checks them, answers questions,
                      works out recommendations
  app.js              draws the website and its panels
  draft.js            the Test a draft tool
  style.css           how everything looks, including the four themes
  check-cli.js        the automatic Collection check that GitHub runs
.github/              the check's settings, and the pull request and bug report forms
```

When someone opens your live link, their browser downloads `index.html`, the
engine, and your three data files. Then the engine builds the whole website
from the data, right there in their browser.

## What makes this a database

A **database** is information organized so a computer can search it, sort
it, count it and connect it. Yours has all the main parts:

| Idea | In your collection |
| --- | --- |
| **Table** | `collection.csv` and `reviews.csv`. Each is one table. |
| **Row** (also called a *record*) | one item, or one review |
| **Field** (also called a *column*) | one kind of information: `title`, `year`, `stars` |
| **Data types** | the engine notices which fields hold **numbers** (so 9 comes before 10, not after it) and which hold **lists** (values separated by `;`). Everything else is **text**. |
| **Key** | the `id` field. Every row has a different one, so there's never any doubt which row you mean. |
| **Foreign key** | the `item` field in `reviews.csv`. It holds a key from the *other* table: it points to a row in `collection.csv`. |
| **Query** | a question, like *"which rows have genre Animation, sorted by year?"* That's **Ask the database**. |

The file format, **CSV** ("comma-separated values"), is about 50 years old,
and it's still one of the most common ways data moves between programs.
Spreadsheet programs open it, and GitHub shows it as a table.

## Asking questions: SQL

Real databases (the ones behind online stores, banks, school records, and
almost every app on your phone) answer questions written in a language
called **SQL**. **Ask the database** shows the SQL version of every
question you ask:

```sql
SELECT * FROM collection
WHERE runtime > 120
ORDER BY year DESC;
```

means *"show every row from the collection table where runtime is more than
120, newest first."*

**Count by** is a different kind of question: it puts rows into groups and
counts each group (`GROUP BY`). And sorting by **average stars** needs both
tables at once. SQL calls that a **join**: it matches each review's `item`
to a collection row's `id`, then averages the stars for each row.

## How recommendations work

When you open an item, the engine scores every other item:

- **+1 for each value they share** in the `filters` fields. *Coco* and
  *Moana* are both Animation and both Musical: +2.
- **+1 for each person who gave both 4 or 5 stars.** Ana loved both: +1.

The highest scores are shown, with the reasons in the "why" line. That's
the same basic idea as "customers who bought this also bought…" on shopping
sites. Theirs use millions of shoppers instead of three friends, and many
more signals, but the idea is the same. It also explains their mistakes: a
recommendation is only as good as the data behind it.

## Why it's fast (and when it wouldn't be)

Your whole database is downloaded into the visitor's browser, so every
search and filter happens instantly with no waiting. That works well for a
few hundred rows. A real store with millions of products can't send
everything to every visitor, so its database lives on a **server**: your
browser sends the question, and only the answer comes back.

## Connections to the course

- **Data representation:** a table is just text, with commas and line breaks
  for structure. Everything else is the engine's interpretation.
- **Abstraction:** visitors see cards and filters, you see rows and fields,
  and the engine sees lists of strings and numbers.
- **Collaboration:** a shared file means merge conflicts, and pull requests
  plus an automatic check keep bad data out of `main`.
