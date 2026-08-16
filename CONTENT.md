# Publishing a new post

You have three hours (probably less) on a Thursday night. Here's the exact
path from idea to live, so you don't have to remember or re-derive it.

## 1. Write the file

Create a new file in `src/content/blog/`, named `your-post-slug.md`
(lowercase, hyphens, no spaces — this becomes the URL: `/blog/your-post-slug`).

If you've got a drafted outline sitting in `content/drafts/`, this is where
it graduates to. Move/rewrite it here rather than starting from nothing.

## 2. Add frontmatter

Every post needs this block at the top, exactly:

```yaml
---
title: 'Your Post Title'
description: 'One sentence, shows up in previews and search results.'
pubDate: 'Aug 16 2026'
heroImage: '../../assets/blog-placeholder-1.jpg' # optional — swap for a real image or drop this line
---
```

`pubDate` accepts most date formats, but stick to `'Mon DD YYYY'` for
consistency. `heroImage` is optional — if you don't set one, the post just
won't have a banner image.

## 3. Write the post

Standard Markdown below the frontmatter. Headings, links, images, code
blocks all work as normal.

## 4. Preview it locally

```bash
npm run dev
```

Visit `http://localhost:4321/blog/your-post-slug` and check it reads right.

## 5. Ship it

```bash
git add .
git commit -m "Add post: your post title"
git push
```

Cloudflare Pages rebuilds and deploys automatically on push to `main` —
no separate deploy step. Give it 1-2 minutes, then check the live URL.

## 6. That's it

No CMS, no separate publish button, no "wait for review." Committing to
`main` is publishing. Treat that as a feature, not a risk — it's what makes
this sustainable at one evening a week.

## Housekeeping (do this occasionally, not every post)

- **New draft idea?** Drop a rough title + outline in `content/drafts/` —
  see the pattern in `why-im-writing-this.md`. Doesn't need to be tidy,
  it's just so the idea doesn't evaporate.
- **Sitemap** regenerates automatically on every build — nothing to do.
- **Social preview image** for a post defaults to the site's fallback image
  set in `BaseHead.astro` unless you set a `heroImage` — sharing a post
  without one just uses the fallback, not a broken image.
