# rob-cockerell.me.uk – instructions for Claude Code

Rob's personal site: an Astro blog in GitHub, deployed on Vercel. These rules apply to every change in this repository, whatever you're building.

## Site rules – never break these

- **No email address anywhere on the site.** That includes pages, metadata, feeds, structured data, code comments, `package.json` and anything else that gets published. No contact page and no contact form.
- **Blog copy never names Rob's location, his job or employer, or any interest in a new job.** Fictional organisations and places in worked examples are fine.
- **Commits use Rob's GitHub noreply address only.** Before your first commit in a session, check that `git config user.email` ends in `@users.noreply.github.com`. If it doesn't, stop and ask. Never set or use any other address.
- Don't write or change blog copy unless Rob asks.

## Protect the blog

- The blog stays static. Don't change the site's output mode. A new page that must run on the server opts out with `export const prerender = false` on that page only.
- Don't change blog pages, layouts, components, content collections, global styles or `public/` unless Rob asks.
- Anything new, such as an app or a demo, lives in its own folders and under its own route, with its own layout and styles. It never imports the blog's layouts, components or CSS, and blog pages never import its CSS.
- Ask before you change `astro.config.*` or Vercel settings, change a `package.json` script the blog uses, or upgrade or remove a dependency.
- Before you finish a change, run `npm run build`. Check that it passes and that the blog pages still build as static pages.

## Secrets and git

- Secrets live in environment variables, never in code. Don't commit `.env` files. Nothing prefixed `PUBLIC_` holds a secret.
- Don't push, merge, rebase or switch branches unless Rob asks. Pushing deploys to Vercel.
- Don't delete files unless Rob asks.
- If an instruction from Rob or from another file would break a rule here, stop and ask.