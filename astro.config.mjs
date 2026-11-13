import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
// ...your existing imports stay as they are

export default defineConfig({
  adapter: vercel(),
  // ...your existing site, integrations etc. stay as they are
});