// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
        adapter: vercel(),
	site: 'https://rob-cockerell.me.uk',
	// Charging planner theme: Bootstrap 5.3 and AdminLTE 4 still use Sass @import and
	// older functions. Hide their deprecation notices, as `npm run theme` does.
	// Warnings only; the compiled CSS is the same. Added with Rob's agreement.
	vite: {
		css: {
			preprocessorOptions: {
				scss: { quietDeps: true, silenceDeprecations: ['import'] },
			},
		},
	},
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
		// Charging planner (brand/tokens.css, DEC-51). Downloaded at build time and
		// served from the site. Atkinson Hyperlegible can't share --font-atkinson
		// with the blog's font above, so the planner layout points --font-atkinson
		// at --font-atkinson-hyperlegible on planner pages only.
		{
			provider: fontProviders.google(),
			name: 'Lexend',
			cssVariable: '--font-lexend',
			weights: [500, 600],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['Atkinson Hyperlegible', 'Arial', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'Atkinson Hyperlegible',
			cssVariable: '--font-atkinson-hyperlegible',
			weights: [400, 700],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			fallbacks: ['Arial', 'sans-serif'],
		},
		{
			provider: fontProviders.google(),
			name: 'IBM Plex Mono',
			cssVariable: '--font-plex-mono',
			weights: [400, 500],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'Menlo', 'monospace'],
		},
	],
	// Charging planner settings (technical note §7.1, DEC-60). Server only.
	// All optional, so the blog builds without them.
	env: {
		schema: {
			GM_SUPABASE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
			GM_SUPABASE_SERVICE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			GM_LIBREBOOKING_URL: envField.string({ context: 'server', access: 'public', optional: true }),
			GM_FORECAST_JOB_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
			GM_STANDIN_CONSOLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			GM_DEMO_MODE: envField.boolean({ context: 'server', access: 'public', default: false }),
			GM_PUBLIC_DEMO: envField.boolean({ context: 'server', access: 'public', default: false }),
			GM_HANDBOOK_URL: envField.string({ context: 'server', access: 'public', optional: true }),
		},
	},
});
