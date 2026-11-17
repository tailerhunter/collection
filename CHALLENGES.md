# Challenges

Your team's job: turn the sample movie collection into **your** collection,
and make it something worth showing off on **Tuesday, December 1**.

- **Day 1** is for setting up and planning.
- **Make it yours** is a menu. Challenge 1 is for everyone. Then pick at
  least **2 more** (teams of 4: at least **3 more**). Do more if you like.
- Every change is a pull request that a teammate approves (README section 3).

---

## Day 1: first steps

1. **Set up.** The owner makes the team's copy, turns on the live link, and
   invites everyone. Everyone accepts (README section 1).
2. **Everyone: one small pull request.** Add one review to
   `data/reviews.csv`, for any movie in the sample. A teammate approves it,
   then merge it. Check that your review shows up on the live link.
3. **Team: write a plan.** Open **Issues** → **New issue** → **Blank issue**,
   titled `Project plan`. Answer:
   - What will your collection be? Why that?
   - What fields will each item have? Write out your first row, like
     `id,name,brand,year,price,colors,image`. Include at least one number
     field and one list field.
   - Who does what? (README section 2 has ideas.)
   - Which challenges from the menu below will you do?
   - What do you want to show on December 1?

**Done when:** everyone has a merged pull request, and the plan issue
answers all five questions.

---

## Make it yours

### 1. Your own collection *(everyone)*

Replace the sample with your collection.

- Change the first row of `collection.csv` to your own fields.
- Add at least **8 rows per teammate** (2 people: 16 rows, 3 people: 24).
- Update `settings.txt`: title, tagline, your names, theme, and which fields
  the cards, filters, sorting and search use.
- Replace the sample reviews with your own (`reviews.csv`).

> Tip: change the first row and a few example rows in **Test a draft** before
> you commit. Every row has to match the first row, so it's easier to get
> the shape right before the whole team starts adding rows.

**Done when:** no sample movies are left · at least 8 rows per teammate ·
your own fields, including at least one number field and one list field ·
the live link says **✓ No problems**.

### 2. Pictures for everything

Every item gets a real picture: one you took, one you drew, or one you're
allowed to use (look for "public domain" or "Creative Commons", and add a
`credit` field saying where it's from).

- Pictures go in `images/` (**Add file** → **Upload files**). Keep the file
  names simple: `air-max-90.jpg`, not `IMG_4032 (1).JPG`.
- Pick the **card shape** that fits your pictures: `tall`, `square` or `wide`.

**Done when:** every card shows a picture, none say *Picture not found*, and
the card shape fits them.

### 3. Three questions

Your collection can answer questions. Find three things a visitor would
want to know, using **Ask the database** and **Count by**. For example:
*Which of our games came out before 2000?* · *What's the most common brand?*
· *Which genre do we rate highest?*

- Put the three answers on the site, in the `about` setting.
- Save a screenshot of each question with its SQL.

**Done when:** the about line states three facts that came from your
database, and you can show the question behind each one.

### 4. Reviews worth trusting *(whole team)*

Recommendations come from what items have in common and from your reviews
(see docs/HOW-IT-WORKS.md). Make them good.

- Everyone reviews at least 8 items, with honest stars and a comment.
- Open a few items and read the **If you liked this…** list. Find one
  recommendation you agree with and one that surprises you. Read its "why"
  line to work out where it came from.
- Change your data (a field, a filter, more reviews) to fix the surprising
  one, if it's wrong.

**Done when:** every item has at least one review, and each teammate can
point to one good and one strange recommendation and explain both.

### 5. Data detective *(two people)*

One teammate secretly plants **three data mistakes** in a pull request. For
example: a value spelled two ways (`Nike` and `nike`), a number written as
words, a review pointing to the wrong id, or a fact that's just wrong. The
reviewer finds them using the **Collection check**, the **problems** list,
**Count by** (look for twins!), and their own eyes.

**Done when:** the reviewer found all three and listed them (file, line,
what's wrong) in **Request changes**. Then the planter fixes them. Swap
roles if you have time.

### 6. Conflict on purpose *(two people)*

Make a merge conflict happen, then fix it.

1. Two teammates each add a new row at the **very end** of
   `collection.csv`, in two separate pull requests, at the same time.
2. Approve and merge the first one.
3. The second one now says *This branch has conflicts*. Resolve it so that
   **both** rows are kept (README section 6).

**Done when:** both rows are on the live link, and you have a screenshot of
the conflict screen before you fixed it.

### 7. Links out

Give every item a link to somewhere useful: where to buy it, a trailer, the
recipe's source, an official page. Add a `link` field and put it in
`details`.

**Done when:** every item's page has a link, and each one opens the right
page.

### 8. Easy to find

A collection is only useful if people can find things in it. Test yours on
someone outside your team.

- Write down three items. Ask a visitor to find each one using only search,
  filters and sorting. Watch, but don't help.
- Whatever slowed them down, fix it: better `search` fields, better
  `filters`, clearer card titles and subtitles.

**Done when:** a visitor finds all three items in under a minute each.

---

## Before December 1: show and tell

You'll have about two minutes. No slides needed: just your live link.

- [ ] The live link is open and says **✓ No problems**.
- [ ] Open one item's page: show its reviews and its recommendations.
- [ ] Ask the database one question, live.
- [ ] Each person says one thing they made.
- [ ] One thing that surprised you, or was harder than you expected.
