# Going further (optional)

Everything here is **optional**. The project can be completed in full without
anything on this page, and without using AI at all.

These ideas are for teams that have done their challenges and want more.
Some need nothing new. Others need changes to the engine, which is where an
AI assistant can help, as long as **you stay in charge of checking its work**.

---

## No new skills needed

- **A wish list.** Add a `status` field (`have` or `want`) and make it a
  filter. Now the site is two collections in one.
- **Staff picks.** Add a `pick` field (`yes` or blank), make it a filter, and
  mention it in the `about` line.
- **Guest reviewers.** Friends outside the team can't edit your repository,
  but they can tell you their stars and comments. Add them to `reviews.csv`
  with their permission, and watch the recommendations change.
- **A second theme.** Try every theme and card shape. Which one fits your
  collection best? Why?

---

## With an AI assistant

### Rules for working with AI on code

1. **Work on a branch.** Every change goes through a pull request anyway, so
   nothing reaches `main` until a teammate has reviewed it.
2. **Give it context.** It hasn't seen this project. Tell it this is a
   static website in plain JavaScript with no libraries, that the data is
   read and checked in `engine/database.js` and drawn in `engine/app.js`,
   and paste in the files it needs to see.
3. **Ask it to explain before you accept.** "Before you change anything, tell
   me which files you'll change and why." If you can't follow the
   explanation, ask again until you can.
4. **Keep the check honest.** If the feature adds a new setting or a new
   kind of value, `engine/database.js` has to learn about it too. Otherwise
   the **Collection check** will (correctly) call it a mistake.
5. **Test it yourself.** Use the "check it" list for each idea, and have a
   teammate who didn't build it try it too.
6. **Say so in the pull request**, like `Add a timeline view (AI-assisted)`,
   and note anything the AI got wrong the first time and how you caught it.

You're responsible for every line in your repository, whoever typed it.

### Ideas

**Compare two items** · easier
A "compare" button on each item's page, then a side-by-side table of the two.
> Check it: every field lines up · list fields show all their values ·
> higher numbers are highlighted · it works at phone width.

**A timeline** · medium
A view that lays items out along a line by a number field, like `year`.
> Check it: the order matches **Ask the database** sorted by that field ·
> items with no value are listed separately, not dropped · it scrolls
> sideways on a phone instead of squashing.

**A chart of two numbers** · medium
A scatter plot of two number fields (like runtime against stars), where each
dot is an item you can click.
> Check it: hovering or tapping a dot shows which item it is · the axes are
> labeled · a field with blanks doesn't break it.

**Head to head** · medium
Shows two random items; the visitor picks the one they like more. After 10
rounds, show their personal ranking. (Keep it in the browser's storage, not
the data files.)
> Check it: the same pair doesn't come up twice in a row · **Start over**
> clears it · it works with an odd number of items.

**Import a friend's collection** · harder
Paste another team's `collection.csv` into a box and see both collections in
one gallery.
> Check it: ids that clash are handled · fields with the same name merge ·
> fields that only one has still show · the problems list still works.

**A map** · harder
If your items have places (restaurants, parks, travel spots), add `lat` and
`lon` fields and show them on a map.
> Check it: every pin opens the right item · items without a place still
> appear in the gallery · it loads on a school Chromebook. (Maps usually
> need an outside library and map pictures from another website. Ask the AI
> which, and check that they're free to use.)
